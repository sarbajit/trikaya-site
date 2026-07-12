/**
 * seed-data.ts
 *
 * Realistic sample data for the Trikaya booking platform, matching the
 * schema fields in /docs/PROJECT_SPEC.md section 6.
 *
 * Purpose: gives Claude Code (and you) real content to build and test the
 * adaptive UI against — both the "single property" and "large catalogue"
 * scenarios described in spec section 4 — instead of Lorem Ipsum.
 *
 * Usage: import into a one-off seed script (e.g. scripts/seed.ts) that
 * connects to MongoDB and inserts these via your Mongoose models. Not meant
 * to be run as-is — it's plain data, wire it to your actual models in Phase 1.
 *
 * TESTING THE TWO UI EXTREMES:
 *  - Single-property mode: seed only propertiesSeed[0] and its related
 *    roomTypes/ratePlans, and check the home page renders as a full
 *    showcase, not an empty grid.
 *  - Large-catalogue mode: seed the full set below (9 properties across
 *    5 destinations) to check search/filter, grouping, and pagination.
 */

export const propertiesSeed = [
  {
    slug: "pinecrest-aritar",
    name: "PineCrest",
    destination: "Sikkim",
    address: "Aritar, East Sikkim",
    geo: { lat: 27.3314, lng: 88.6138 },
    description:
      "A heritage-style boutique property in the heart of Gangtok, built around a courtyard garden with views of the Kanchenjunga range on clear days.",
    propertyType: "hotel",
    amenities: ["Free Wi-Fi", "Mountain view", "In-house restaurant", "Airport transfer", "Bonfire on request"],
    starRating: 4,
    isActive: true,
    homepageMode: "auto",
  }
] as const;

/**
 * Room types — mixes both pricing models deliberately, and mixes
 * b2bEnabled on/off per room type so the pricing engine has real variety
 * to handle from the start (spec section 5.2).
 */
export const roomTypesSeed = [
  // Nor-Khill Heritage Residency (per_night, B2B on)
  {
    propertySlug: "pinecrest-aritar",
    name: "Heritage Double Room",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 6500,
    basePriceB2B: 5200,
    totalInventory: 6,
  },
  {
    propertySlug: "pinecrest-aritar",
    name: "Mountain View Suite",
    pricingModel: "per_night",
    maxOccupancy: 3,
    basePriceB2C: 9800,
    basePriceB2B: 7900,
    totalInventory: 3,
  },


] as const;

/**
 * Property-level B2B toggle — demonstrates that B2B can be on for some
 * properties and off for others, layered under the global SiteSettings.b2bEnabled
 * master switch (spec section 5.10).
 */
export const propertyB2BFlags: Record<string, boolean> = {
  "pinecrest-aritar": true,

};

/**
 * Seasonal rate override example (spec section 5.2) — Yumthang gets a peak
 * winter surcharge for snowfall season, Tawang gets a Losar festival surcharge.
 * Use these to test the RatePlans override logic against basePrice.
 */
export const ratePlansSeed = [
  {
    propertySlug: "pinecrest-aritar",
    roomTypeName: "Mountain View Suite",
    label: "Winter Snowfall Season",
    startDate: "2026-12-15",
    endDate: "2027-02-15",
    b2cRate: 2800,
    b2bRate: 2300,
  },

] as const;

/**
 * Sample B2B agent — one approved, one pending, to test both states of the
 * approval workflow (spec section 5.1 / 5.10).
 */
export const agentsSeed = [
  {
    businessName: "Highland Travels & Tours",
    gstin: "18AABCH1234M1Z5",
    contactPerson: "Tenzin Bhutia",
    email: "tenzin@highlandtravels.example",
    phone: "+91 98320 00000",
    status: "approved",
  },
  {
    businessName: "Northeast Wanderers Pvt Ltd",
    gstin: "17AABCN5678K1Z2",
    contactPerson: "Riya Marak",
    email: "riya@newanderers.example",
    phone: "+91 98630 00000",
    status: "pending", // shows up in the admin approval queue
  },
] as const;

/**
 * Minimal SiteSettings seed for first boot — replace with your real details
 * before going live. showCompanyName lets you demo the "logo only" toggle.
 */
export const siteSettingsSeed = {
  companyName: "Trikaya",
  showCompanyName: true,
  primaryColor: "#0F5132", // placeholder deep pine green — swap for your brand color
  secondaryColor: "#C98A2C", // placeholder warm amber — swap for your brand color
  addresses: ["Kolkata, West Bengal, India"],
  phones: ["+91 90000 00000"],
  emails: ["reservations@trikaya.example"],
  socialLinks: [
    { platform: "instagram", url: "https://instagram.com/trikaya" },
    { platform: "facebook", url: "https://facebook.com/trikaya" },
  ],
  contactRecipientEmail: "reservations@trikaya.example",
  b2bEnabled: true,
  invoicePrefix: "QT-INV-",
};
