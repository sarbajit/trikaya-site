/**
 * Single shared server-side pricing/availability engine (spec §5.2/5.3).
 *
 * This module is the ONLY place a quote is computed. Both the future
 * availability-check API and the future booking-creation API (Phase 7, not
 * built yet) must call getRoomTypeQuote() rather than re-deriving price or
 * availability, so a quoted price and a charged price can never drift.
 *
 * Non-goal: this module does not perform atomic inventory locking. At
 * booking-confirmation time, Phase 7 must still do an atomic conditional
 * update (e.g. increment `booked` guarded by `booked + blocked < totalUnits`)
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

export interface QuoteInput {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  session: Session | null | undefined;
}

export interface NightlyBreakdown {
  date: string;
  rate: number;
  source: "rateplan" | "base";
  ratePlanId?: string;
  ratePlanLabel?: string;
  availableUnits: number;
}

export interface RoomTypeQuote {
  roomTypeId: string;
  propertyId: string;
  pricingModel: PricingModel;
  isB2B: boolean;
  guests: number;
  maxOccupancy: number;
  nights: number;
  currency: "INR";
  nightlyBreakdown: NightlyBreakdown[];
  subtotal: number;
  totalAmount: number;
  isAvailable: boolean;
  guestsExceedOccupancy: boolean;
  unavailableDates: string[];
}

/**
 * The single shared entry point. Resolves B2B eligibility internally (never
 * accepted as a caller-supplied flag) so a quote can never be spoofed into
 * B2B pricing by a client-controlled parameter.
 */
export async function getRoomTypeQuote(input: QuoteInput): Promise<RoomTypeQuote> {
  await connectDB();

  if (!Number.isInteger(input.guests) || input.guests < 1) {
    throw new InvalidQuoteRequestError("guests must be a positive integer");
  }

  const roomType = await RoomType.findById(input.roomTypeId);
  if (!roomType) {
    throw new RoomTypeNotFoundError(input.roomTypeId);
  }

  let nights: Date[];
  try {
    nights = enumerateNights(input.checkIn, input.checkOut);
  } catch {
    throw new InvalidQuoteRequestError("checkOut must be after checkIn");
  }

  const isB2B = await getB2BEligibility(input.session);
  const rangeStart = nights[0];
  const rangeEnd = toDateOnlyUTC(input.checkOut);

  const [ratePlans, availabilityDocs] = await Promise.all([
    RatePlan.find({
      roomTypeId: roomType._id,
      startDate: { $lt: rangeEnd },
      endDate: { $gt: rangeStart },
    }),
    Availability.find({
      roomTypeId: roomType._id,
      date: { $gte: rangeStart, $lt: rangeEnd },
    }),
  ]);

  const availabilityByDate = new Map<string, IAvailability>(
    availabilityDocs.map((doc) => [formatISODate(toDateOnlyUTC(doc.date)), doc])
  );

  const guestsExceedOccupancy = input.guests > roomType.maxOccupancy;
  const unavailableDates: string[] = [];

  const nightlyBreakdown: NightlyBreakdown[] = nights.map((date) => {
    const iso = formatISODate(date);
    const { rate, source, ratePlanId, ratePlanLabel } = resolveNightlyRate(
      ratePlans,
      date,
      isB2B,
      roomType.basePriceB2C,
      roomType.basePriceB2B
    );
    const availableUnits = resolveAvailableUnits(availabilityByDate.get(iso), roomType.totalInventory);
    if (availableUnits < 1) unavailableDates.push(iso);

    return { date: iso, rate, source, ratePlanId, ratePlanLabel, availableUnits };
  });

  const perNightTotal = nightlyBreakdown.reduce((sum, n) => sum + n.rate, 0);
  const subtotal =
    roomType.pricingModel === "per_person_per_night" ? perNightTotal * input.guests : perNightTotal;

  return {
    roomTypeId: String(roomType._id),
    propertyId: String(roomType.propertyId),
    pricingModel: roomType.pricingModel,
    isB2B,
    guests: input.guests,
    maxOccupancy: roomType.maxOccupancy,
    nights: nights.length,
    currency: "INR",
    nightlyBreakdown,
    subtotal,
    totalAmount: subtotal,
    isAvailable: unavailableDates.length === 0 && !guestsExceedOccupancy,
    guestsExceedOccupancy,
    unavailableDates,
  };
}
