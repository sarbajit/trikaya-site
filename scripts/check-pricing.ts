import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import type { Session } from "next-auth";
import { connectDB } from "../lib/db";
import { formatISODate, getUTCDayOfWeek } from "../lib/date-helpers";
import { getBookingQuote } from "../lib/pricing";
import { Availability } from "../models/Availability";
import { Property } from "../models/Property";
import { RatePlan } from "../models/RatePlan";
import { RoomType } from "../models/RoomType";
import { getSiteSettings } from "../models/SiteSettings";

const SLUG = "check-pricing-fixture";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ok: ${message}`);
}

function approvedAgentSession(): Session {
  return {
    user: { id: "test-agent", role: "agent", approved: true, name: "Test Agent", email: "agent@test.com" },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } as Session;
}

function unapprovedAgentSession(): Session {
  return {
    user: { id: "test-agent-2", role: "agent", approved: false, name: "Test Agent", email: "agent2@test.com" },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } as Session;
}

async function main() {
  await connectDB();

  const settings = await getSiteSettings();
  const originalB2bEnabled = settings.b2bEnabled;

  await Property.deleteOne({ slug: SLUG });

  const property = await Property.create({
    name: "Check Pricing Fixture",
    slug: SLUG,
    destination: "Test",
    address: "Test address",
    description: "Throwaway fixture for scripts/check-pricing.ts",
    propertyType: "hotel",
    isActive: true,
    homepageMode: "auto",
  });

  const roomType = await RoomType.create({
    propertyId: property._id,
    name: "Fixture Room",
    maxOccupancy: 4,
    pricingModel: "per_person_per_night",
    basePriceB2C: 1000,
    basePriceB2B: 800,
    childPriceB2C: 400,
    childPriceB2B: 300,
    totalInventory: 3,
  });

  // A blanket "season" rate covering all of August 2026.
  const seasonStart = new Date("2026-08-01T00:00:00.000Z");
  const seasonEnd = new Date("2026-09-01T00:00:00.000Z");
  const seasonPlan = await RatePlan.create({
    roomTypeId: roomType._id,
    label: "Season",
    startDate: seasonStart,
    endDate: seasonEnd,
    b2cRate: 1200,
    b2bRate: 900,
  });

  // A single-night, day-restricted override that overlaps the season plan
  // on 2026-08-10 — this should win via the "daysOfWeek beats blanket" rule.
  const surgeDate = new Date("2026-08-10T00:00:00.000Z");
  const surgeEnd = new Date("2026-08-11T00:00:00.000Z");
  const surgePlan = await RatePlan.create({
    roomTypeId: roomType._id,
    label: "Surge",
    startDate: surgeDate,
    endDate: surgeEnd,
    daysOfWeek: [getUTCDayOfWeek(surgeDate)],
    b2cRate: 2000,
    b2bRate: 1700,
  });

  // Block a date entirely outside the rate plans, in March 2027.
  const blockedDate = new Date("2027-03-01T00:00:00.000Z");
  await Availability.create({
    roomTypeId: roomType._id,
    date: blockedDate,
    totalUnits: roomType.totalInventory,
    booked: 0,
    blocked: roomType.totalInventory,
  });

  try {
    await getSiteSettings();
    settings.b2bEnabled = true;
    await settings.save();

    console.log("Test 1: overlapping RatePlans — day-restricted plan beats blanket season plan");
    const augustQuote = await getBookingQuote({
      checkIn: "2026-08-10",
      checkOut: "2026-08-13",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 2, childAges: [] }],
      session: null,
    });
    assert(augustQuote.nights === 3, "3 nights returned");
    const augustRoom = augustQuote.rooms[0];
    const night10 = augustRoom.nightlyRates.find((n) => n.date === "2026-08-10")!;
    const night11 = augustRoom.nightlyRates.find((n) => n.date === "2026-08-11")!;
    assert(night10.ratePlanId === String(surgePlan._id), "2026-08-10 resolves to the more specific Surge plan");
    assert(night10.adultRate === 2000, "2026-08-10 uses Surge B2C rate 2000");
    assert(night11.ratePlanId === String(seasonPlan._id), "2026-08-11 resolves to the blanket Season plan");
    assert(night11.adultRate === 1200, "2026-08-11 uses Season B2C rate 1200");
    assert(
      augustRoom.roomTotal === (2000 + 1200 + 1200) * 2,
      "per_person_per_night room total scales by adults (2), no children"
    );

    console.log("Test 2: no matching RatePlan falls back to room type base rate");
    const marchQuoteB2C = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: null,
    });
    assert(marchQuoteB2C.rooms[0].nightlyRates[0].source === "base", "no RatePlan matches, source is base");
    assert(marchQuoteB2C.rooms[0].nightlyRates[0].adultRate === 1000, "base B2C rate used");

    console.log("Test 3: per_person_per_night scales with adult count");
    const marchQuoteThreeGuests = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 3, childAges: [] }],
      session: null,
    });
    assert(marchQuoteThreeGuests.rooms[0].roomTotal === 3000, "3 adults x 1000 = 3000");

    console.log("Test 4: blocked date is surfaced as unavailable");
    const blockedQuote = await getBookingQuote({
      checkIn: formatISODate(blockedDate),
      checkOut: "2027-03-02",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: null,
    });
    assert(blockedQuote.isAvailable === false, "isAvailable is false for a fully blocked date");
    assert(blockedQuote.unavailableDates.includes("2027-03-01"), "unavailableDates includes the blocked date");

    console.log("Test 5: date with no Availability doc defaults to available (totalInventory units open)");
    assert(
      !marchQuoteB2C.unavailableDates.includes("2027-03-05"),
      "no Availability doc -> date is available"
    );

    console.log("Test 6: B2B pricing only applies for an approved agent when b2bEnabled is true");
    const b2bQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: approvedAgentSession(),
    });
    assert(b2bQuote.isB2B === true, "approved agent + b2bEnabled -> isB2B true");
    assert(b2bQuote.rooms[0].nightlyRates[0].adultRate === 800, "approved agent gets base B2B rate 800");

    console.log("Test 7: unapproved agent always gets B2C pricing");
    const unapprovedQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: unapprovedAgentSession(),
    });
    assert(unapprovedQuote.isB2B === false, "unapproved agent -> isB2B false");
    assert(unapprovedQuote.rooms[0].nightlyRates[0].adultRate === 1000, "unapproved agent gets B2C rate 1000");

    console.log("Test 8: b2bEnabled=false forces B2C even for an approved agent");
    settings.b2bEnabled = false;
    await settings.save();
    const b2bDisabledQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: approvedAgentSession(),
    });
    assert(b2bDisabledQuote.isB2B === false, "b2bEnabled=false -> isB2B false regardless of agent approval");

    console.log("Test 9: child age banding — infant free, in-band gets child rate, above band gets adult rate");
    const childQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [3, 8, 15] }],
      session: null,
    });
    assert(!childQuote.hasOccupancyErrors, "1 adult + 3 children is within maxOccupancy (4) and >= 2 total");
    assert(
      childQuote.rooms[0].nightlyRates[0].amount === 1000 + 0 + 400 + 1000,
      "adult(1000) + infant(0, age 3 < 5) + child(400, age 8 <= childMaxAge 12) + adult-rate(1000, age 15 > childMaxAge)"
    );

    console.log("Test 10: per_person_per_night rooms require at least 2 total occupants");
    const singleOccupantQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [{ roomTypeId: roomType._id.toString(), adults: 1, childAges: [] }],
      session: null,
    });
    assert(
      singleOccupantQuote.rooms[0].occupancyError === "This room's pricing requires at least 2 guests",
      "1 adult, 0 children on a per_person_per_night room is rejected"
    );
    assert(singleOccupantQuote.hasOccupancyErrors === true, "hasOccupancyErrors reflects the room-level error");

    console.log("Test 11: requesting more rooms of one type than remaining inventory is unavailable");
    const overbookQuote = await getBookingQuote({
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      rooms: [
        { roomTypeId: roomType._id.toString(), adults: 2, childAges: [] },
        { roomTypeId: roomType._id.toString(), adults: 2, childAges: [] },
        { roomTypeId: roomType._id.toString(), adults: 2, childAges: [] },
        { roomTypeId: roomType._id.toString(), adults: 2, childAges: [] },
      ],
      session: null,
    });
    assert(
      overbookQuote.unavailableDates.includes("2027-03-05"),
      "4 rooms requested against totalInventory 3 -> date marked unavailable"
    );
    assert(overbookQuote.isAvailable === false, "isAvailable false when a room-type group exceeds inventory");

    console.log("\nAll pricing engine checks passed.");
  } finally {
    settings.b2bEnabled = originalB2bEnabled;
    await settings.save();
    await RatePlan.deleteMany({ roomTypeId: roomType._id });
    await Availability.deleteMany({ roomTypeId: roomType._id });
    await RoomType.deleteMany({ propertyId: property._id });
    await Property.deleteOne({ _id: property._id });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
