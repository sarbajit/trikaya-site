/**
 * Single shared server-side pricing/availability engine (spec §5.2/5.3).
 *
 * This module is the ONLY place a quote is computed. Both the availability-
 * check API and the booking-creation API call getBookingQuote() rather than
 * re-deriving price or availability, so a quoted price and a charged price
 * can never drift.
 *
 * A booking can span multiple rooms, possibly of different room types, all
 * within one property and one shared date range. getBookingQuote() resolves
 * B2B eligibility internally (never accepted as a caller-supplied flag) and
 * validates occupancy/child-age rules the same way for every caller.
 *
 * Non-goal: this module does not perform atomic inventory locking. At
 * booking-confirmation time, the webhook still does an atomic conditional
 * update (increment `booked` guarded by `booked + blocked + count <= totalUnits`)
 * to avoid a race between quote time and confirm time — this function only
 * answers "as of right now".
 */

import type { Session } from "next-auth";
import { connectDB } from "@/lib/db";
import { enumerateNights, formatISODate, getUTCDayOfWeek, toDateOnlyUTC } from "@/lib/date-helpers";
import { Availability, type IAvailability } from "@/models/Availability";
import { RatePlan, type IRatePlan } from "@/models/RatePlan";
import { RoomType, type PricingModel } from "@/models/RoomType";
import { getSiteSettings } from "@/models/SiteSettings";

export class RoomTypeNotFoundError extends Error {
  constructor(roomTypeId: string) {
    super(`Room type not found: ${roomTypeId}`);
    this.name = "RoomTypeNotFoundError";
  }
}

export class InvalidQuoteRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidQuoteRequestError";
  }
}

/**
 * The single canonical place that decides whether B2B pricing applies.
 * Every consumer that needs to render/compute a B2B vs B2C rate must go
 * through this function rather than re-testing session.user.role/approved
 * and SiteSettings.b2bEnabled inline.
 */
export async function getB2BEligibility(session: Session | null | undefined): Promise<boolean> {
  if (session?.user?.role !== "agent" || session.user.approved !== true) {
    return false;
  }
  await connectDB();
  const settings = await getSiteSettings();
  return settings.b2bEnabled === true;
}

/** Below this age a child is free (still counts toward occupancy). Fixed business rule, not admin-configurable. */
export const CHILD_MIN_AGE = 5;

/**
 * Resolves the total charge for one room, one night. per_night rooms are a
 * flat per-room rate regardless of headcount. per_person_per_night rooms
 * charge each adult the adult rate, and each child banded by age:
 * under CHILD_MIN_AGE is free, from CHILD_MIN_AGE up to childMaxAge gets the
 * child rate, above childMaxAge is charged the adult rate.
 */
export function computeRoomNightAmount(
  pricingModel: PricingModel,
  adults: number,
  childAges: number[],
  adultRate: number,
  childRate: number,
  childMaxAge: number
): number {
  if (pricingModel === "per_night") {
    return adultRate;
  }
  const childrenCharge = childAges.reduce((sum, age) => {
    if (age < CHILD_MIN_AGE) return sum;
    if (age <= childMaxAge) return sum + childRate;
    return sum + adultRate;
  }, 0);
  return adults * adultRate + childrenCharge;
}

/**
 * Centralizes the occupancy rules so the quote engine and the booking-
 * creation route apply identical checks: at least 1 adult, total heads
 * (adults + all children, including infants) within maxOccupancy, and at
 * least 2 total occupants when the room is priced per person per night.
 */
export function validateRoomOccupancy(
  pricingModel: PricingModel,
  adults: number,
  childAges: number[],
  maxOccupancy: number
): string | null {
  if (adults < 1) return "Each room needs at least 1 adult";
  const totalOccupants = adults + childAges.length;
  if (totalOccupants > maxOccupancy) return `This room allows up to ${maxOccupancy} guests`;
  if (pricingModel === "per_person_per_night" && totalOccupants < 2) {
    return "This room's pricing requires at least 2 guests";
  }
  return null;
}

type RatePlanCandidate = Pick<
  IRatePlan,
  "_id" | "label" | "startDate" | "endDate" | "daysOfWeek" | "b2cRate" | "b2bRate" | "createdAt"
>;

export interface ResolvedRate {
  rate: number;
  source: "rateplan" | "base";
  ratePlanId?: string;
  ratePlanLabel?: string;
}

/**
 * Picks the rate for a single night among possibly-overlapping RatePlans,
 * falling back to the room type's base rate when none match.
 *
 * Tie-break rule for overlapping RatePlans (spec is silent on this, this is
 * an explicit, documented assumption):
 *   1. A plan with a non-empty daysOfWeek (weekday/weekend override) beats
 *      a blanket plan with no daysOfWeek — more specific wins.
 *   2. Among ties, the plan with the shorter date span wins — a short surge
 *      window beats a long season that happens to contain it.
 *   3. Among ties, the most recently created plan wins (admin's latest intent).
 *   4. Final tiebreak: larger _id (most recently inserted) wins, for total
 *      determinism.
 */
export function resolveNightlyRate(
  candidatePlans: RatePlanCandidate[],
  date: Date,
  isB2B: boolean,
  fallbackB2C: number,
  fallbackB2B: number
): ResolvedRate {
  const dow = getUTCDayOfWeek(date);
  const time = date.getTime();

  const matching = candidatePlans.filter((plan) => {
    const start = toDateOnlyUTC(plan.startDate).getTime();
    const end = toDateOnlyUTC(plan.endDate).getTime();
    if (time < start || time >= end) return false;
    if (plan.daysOfWeek && plan.daysOfWeek.length > 0 && !plan.daysOfWeek.includes(dow)) return false;
    return true;
  });

  if (matching.length === 0) {
    return { rate: isB2B ? fallbackB2B : fallbackB2C, source: "base" };
  }

  const sorted = [...matching].sort((a, b) => {
    const aSpecific = (a.daysOfWeek?.length ?? 0) > 0;
    const bSpecific = (b.daysOfWeek?.length ?? 0) > 0;
    if (aSpecific !== bSpecific) return aSpecific ? -1 : 1;

    const aSpan = toDateOnlyUTC(a.endDate).getTime() - toDateOnlyUTC(a.startDate).getTime();
    const bSpan = toDateOnlyUTC(b.endDate).getTime() - toDateOnlyUTC(b.startDate).getTime();
    if (aSpan !== bSpan) return aSpan - bSpan;

    const aCreated = a.createdAt.getTime();
    const bCreated = b.createdAt.getTime();
    if (aCreated !== bCreated) return bCreated - aCreated;

    return String(b._id).localeCompare(String(a._id));
  });

  const chosen = sorted[0];
  return {
    rate: isB2B ? chosen.b2bRate : chosen.b2cRate,
    source: "rateplan",
    ratePlanId: String(chosen._id),
    ratePlanLabel: chosen.label,
  };
}

/**
 * Units available for a given date. If no Availability doc exists for
 * roomTypeId+date, the date defaults to fully open at the room type's
 * totalInventory (admins only need to persist Availability docs for
 * exceptions: blocks, or inventory overrides).
 */
export function resolveAvailableUnits(
  availabilityDoc: Pick<IAvailability, "totalUnits" | "booked" | "blocked"> | undefined,
  totalInventory: number
): number {
  if (!availabilityDoc) return Math.max(0, totalInventory);
  return Math.max(0, availabilityDoc.totalUnits - availabilityDoc.booked - availabilityDoc.blocked);
}

export interface RoomSelection {
  roomTypeId: string;
  adults: number;
  childAges: number[];
}

export interface BookingQuoteInput {
  checkIn: string;
  checkOut: string;
  rooms: RoomSelection[];
  session: Session | null | undefined;
}

export interface RoomNightlyRate {
  date: string;
  adultRate: number;
  childRate: number;
  source: "rateplan" | "base";
  ratePlanId?: string;
  ratePlanLabel?: string;
  amount: number;
}

export interface RoomQuote {
  roomTypeId: string;
  roomTypeName: string;
  pricingModel: PricingModel;
  adults: number;
  childAges: number[];
  maxOccupancy: number;
  nightlyRates: RoomNightlyRate[];
  roomTotal: number;
  occupancyError: string | null;
}

export interface BookingQuote {
  propertyId: string;
  isB2B: boolean;
  nights: number;
  currency: "INR";
  rooms: RoomQuote[];
  totalAmount: number;
  isAvailable: boolean;
  unavailableDates: string[];
  hasOccupancyErrors: boolean;
}

/**
 * The single shared entry point for pricing a (possibly multi-room,
 * possibly multi-room-type) booking. All rooms must belong to the same
 * property — that property is derived from the rooms themselves (never
 * accepted as a caller-supplied propertyId) and mismatches are rejected.
 */
export async function getBookingQuote(input: BookingQuoteInput): Promise<BookingQuote> {
  await connectDB();

  if (input.rooms.length === 0) {
    throw new InvalidQuoteRequestError("At least one room is required");
  }

  let nights: Date[];
  try {
    nights = enumerateNights(input.checkIn, input.checkOut);
  } catch {
    throw new InvalidQuoteRequestError("checkOut must be after checkIn");
  }

  const isB2B = await getB2BEligibility(input.session);
  const settings = await getSiteSettings();
  const childMaxAge = settings.childMaxAge;

  const rangeStart = nights[0];
  const rangeEnd = toDateOnlyUTC(input.checkOut);

  const roomTypeIds = [...new Set(input.rooms.map((r) => r.roomTypeId))];
  const roomTypes = await RoomType.find({ _id: { $in: roomTypeIds } });
  const roomTypeById = new Map(roomTypes.map((rt) => [String(rt._id), rt]));

  for (const id of roomTypeIds) {
    if (!roomTypeById.has(id)) {
      throw new RoomTypeNotFoundError(id);
    }
  }

  const firstRoomType = roomTypeById.get(roomTypeIds[0])!;
  const propertyId = String(firstRoomType.propertyId);
  for (const rt of roomTypes) {
    if (String(rt.propertyId) !== propertyId) {
      throw new InvalidQuoteRequestError("All rooms must belong to the same property");
    }
  }

  const [ratePlans, availabilityDocs] = await Promise.all([
    RatePlan.find({
      roomTypeId: { $in: roomTypeIds },
      startDate: { $lt: rangeEnd },
      endDate: { $gt: rangeStart },
    }),
    Availability.find({
      roomTypeId: { $in: roomTypeIds },
      date: { $gte: rangeStart, $lt: rangeEnd },
    }),
  ]);

  const ratePlansByRoomType = new Map<string, IRatePlan[]>();
  for (const plan of ratePlans) {
    const key = String(plan.roomTypeId);
    const list = ratePlansByRoomType.get(key) ?? [];
    list.push(plan);
    ratePlansByRoomType.set(key, list);
  }

  const availabilityByRoomTypeDate = new Map<string, IAvailability>();
  for (const doc of availabilityDocs) {
    availabilityByRoomTypeDate.set(`${doc.roomTypeId}:${formatISODate(toDateOnlyUTC(doc.date))}`, doc);
  }

  const countByRoomType = new Map<string, number>();
  for (const selection of input.rooms) {
    countByRoomType.set(selection.roomTypeId, (countByRoomType.get(selection.roomTypeId) ?? 0) + 1);
  }

  const unavailableDatesSet = new Set<string>();
  for (const [roomTypeId, count] of countByRoomType) {
    const roomType = roomTypeById.get(roomTypeId)!;
    for (const date of nights) {
      const iso = formatISODate(date);
      const availableUnits = resolveAvailableUnits(
        availabilityByRoomTypeDate.get(`${roomTypeId}:${iso}`),
        roomType.totalInventory
      );
      if (availableUnits < count) unavailableDatesSet.add(iso);
    }
  }

  let hasOccupancyErrors = false;
  const roomQuotes: RoomQuote[] = input.rooms.map((selection) => {
    const roomType = roomTypeById.get(selection.roomTypeId)!;
    const occupancyError = validateRoomOccupancy(
      roomType.pricingModel,
      selection.adults,
      selection.childAges,
      roomType.maxOccupancy
    );
    if (occupancyError) hasOccupancyErrors = true;

    const candidatePlans = ratePlansByRoomType.get(selection.roomTypeId) ?? [];
    const childRate = isB2B ? roomType.childPriceB2B : roomType.childPriceB2C;

    const nightlyRates: RoomNightlyRate[] = nights.map((date) => {
      const iso = formatISODate(date);
      const { rate: adultRate, source, ratePlanId, ratePlanLabel } = resolveNightlyRate(
        candidatePlans,
        date,
        isB2B,
        roomType.basePriceB2C,
        roomType.basePriceB2B
      );
      const amount = computeRoomNightAmount(
        roomType.pricingModel,
        selection.adults,
        selection.childAges,
        adultRate,
        childRate,
        childMaxAge
      );
      return { date: iso, adultRate, childRate, source, ratePlanId, ratePlanLabel, amount };
    });

    const roomTotal = nightlyRates.reduce((sum, n) => sum + n.amount, 0);

    return {
      roomTypeId: selection.roomTypeId,
      roomTypeName: roomType.name,
      pricingModel: roomType.pricingModel,
      adults: selection.adults,
      childAges: selection.childAges,
      maxOccupancy: roomType.maxOccupancy,
      nightlyRates,
      roomTotal,
      occupancyError,
    };
  });

  const totalAmount = roomQuotes.reduce((sum, r) => sum + r.roomTotal, 0);
  const unavailableDates = [...unavailableDatesSet].sort();

  return {
    propertyId,
    isB2B,
    nights: nights.length,
    currency: "INR",
    rooms: roomQuotes,
    totalAmount,
    isAvailable: unavailableDates.length === 0 && !hasOccupancyErrors,
    unavailableDates,
    hasOccupancyErrors,
  };
}
