import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import type { Session } from "next-auth";
import { connectDB } from "../lib/db";
import { formatISODate, getUTCDayOfWeek } from "../lib/date-helpers";
import { getRoomTypeQuote } from "../lib/pricing";
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
    const augustQuote = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2026-08-10",
      checkOut: "2026-08-13",
      guests: 2,
      session: null,
    });
    assert(augustQuote.nights === 3, "3 nights returned");
    const night10 = augustQuote.nightlyBreakdown.find((n) => n.date === "2026-08-10")!;
    const night11 = augustQuote.nightlyBreakdown.find((n) => n.date === "2026-08-11")!;
    assert(night10.ratePlanId === String(surgePlan._id), "2026-08-10 resolves to the more specific Surge plan");
    assert(night10.rate === 2000, "2026-08-10 uses Surge B2C rate 2000");
    assert(night11.ratePlanId === String(seasonPlan._id), "2026-08-11 resolves to the blanket Season plan");
    assert(night11.rate === 1200, "2026-08-11 uses Season B2C rate 1200");
    assert(
      augustQuote.subtotal === (2000 + 1200 + 1200) * 2,
      "per_person_per_night subtotal scales by guests (2)"
    );

    console.log("Test 2: no matching RatePlan falls back to room type base rate");
    const marchQuoteB2C = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      guests: 1,
      session: null,
    });
    assert(marchQuoteB2C.nightlyBreakdown[0].source === "base", "no RatePlan matches, source is base");
    assert(marchQuoteB2C.nightlyBreakdown[0].rate === 1000, "base B2C rate used");

    console.log("Test 3: per_person_per_night scales with guest count");
    const marchQuoteThreeGuests = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      guests: 3,
      session: null,
    });
    assert(marchQuoteThreeGuests.subtotal === 3000, "3 guests x 1000 = 3000");

    console.log("Test 4: blocked date is surfaced as unavailable");
    const blockedQuote = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: formatISODate(blockedDate),
      checkOut: "2027-03-02",
      guests: 1,
      session: null,
    });
    assert(blockedQuote.isAvailable === false, "isAvailable is false for a fully blocked date");
    assert(blockedQuote.unavailableDates.includes("2027-03-01"), "unavailableDates includes the blocked date");

    console.log("Test 5: date with no Availability doc defaults to totalInventory");
    assert(
      marchQuoteB2C.nightlyBreakdown[0].availableUnits === roomType.totalInventory,
      "no Availability doc -> availableUnits === totalInventory"
    );

    console.log("Test 6: B2B pricing only applies for an approved agent when b2bEnabled is true");
    const b2bQuote = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      guests: 1,
      session: approvedAgentSession(),
    });
    assert(b2bQuote.isB2B === true, "approved agent + b2bEnabled -> isB2B true");
    assert(b2bQuote.nightlyBreakdown[0].rate === 800, "approved agent gets base B2B rate 800");

    console.log("Test 7: unapproved agent always gets B2C pricing");
    const unapprovedQuote = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      guests: 1,
      session: unapprovedAgentSession(),
    });
    assert(unapprovedQuote.isB2B === false, "unapproved agent -> isB2B false");
    assert(unapprovedQuote.nightlyBreakdown[0].rate === 1000, "unapproved agent gets B2C rate 1000");

    console.log("Test 8: b2bEnabled=false forces B2C even for an approved agent");
    settings.b2bEnabled = false;
    await settings.save();
    const b2bDisabledQuote = await getRoomTypeQuote({
      roomTypeId: roomType._id.toString(),
      checkIn: "2027-03-05",
      checkOut: "2027-03-06",
      guests: 1,
      session: approvedAgentSession(),
    });
    assert(b2bDisabledQuote.isB2B === false, "b2bEnabled=false -> isB2B false regardless of agent approval");

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
