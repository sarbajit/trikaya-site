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
  },
  {
    slug: "yumthang-valley-eco-resort",
    name: "Yumthang Valley Eco Resort",
    destination: "Sikkim",
    address: "Near Yumthang Valley Road, Lachung, Sikkim 737116",
    geo: { lat: 27.6910, lng: 88.7420 },
    description:
      "Riverside cottages a short drive from Yumthang Valley, built for travelers doing the North Sikkim circuit. Wood-fired heating in every room.",
    propertyType: "resort",
    amenities: ["Bonfire", "Riverside seating", "Room heater", "Local Sikkimese meals", "Trekking desk"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "windamere-heritage-darjeeling",
    name: "Windamere Heritage Stay",
    destination: "Darjeeling",
    address: "Observatory Hill Road, Darjeeling, West Bengal 734101",
    geo: { lat: 27.0479, lng: 88.2636 },
    description:
      "A colonial-era manor converted into a heritage stay overlooking the Darjeeling hills, with a working tea garden view from the front lawn.",
    propertyType: "hotel",
    amenities: ["Tea garden view", "Fireplace lounge", "Library", "Afternoon tea service"],
    starRating: 4,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "glenary-homestay-darjeeling",
    name: "Glenary Family Homestay",
    destination: "Darjeeling",
    address: "Near Chowrasta, Darjeeling, West Bengal 734101",
    geo: { lat: 27.0410, lng: 88.2627 },
    description:
      "A family-run homestay a five-minute walk from Chowrasta Mall, home-cooked meals included, run by a local Darjeeling family for three generations.",
    propertyType: "homestay",
    amenities: ["Home-cooked meals included", "Family hosted", "Walking distance to Mall Road"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "kalimpong-pine-ridge-homestay",
    name: "Pine Ridge Homestay",
    destination: "Kalimpong",
    address: "Durpin Hill Road, Kalimpong, West Bengal 734301",
    geo: { lat: 27.0669, lng: 88.4692 },
    description:
      "A quiet homestay on Durpin Hill with private balconies facing the Teesta valley, popular with travelers wanting a slower pace than Darjeeling.",
    propertyType: "homestay",
    amenities: ["Valley view balcony", "Organic garden meals", "Bonfire on request"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "shillong-ridge-boutique-hotel",
    name: "Ridge Boutique Hotel",
    destination: "Meghalaya",
    address: "Police Bazar, Shillong, Meghalaya 793001",
    geo: { lat: 25.5788, lng: 91.8933 },
    description:
      "A centrally located boutique hotel in Police Bazar, Shillong, walking distance to the main market, with a rooftop cafe overlooking the city.",
    propertyType: "hotel",
    amenities: ["Rooftop cafe", "Free Wi-Fi", "In-house cafe", "Travel desk for Cherrapunji/Mawlynnong trips"],
    starRating: 4,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "mawlynnong-living-root-cottages",
    name: "Living Root Cottages",
    destination: "Meghalaya",
    address: "Mawlynnong Village, East Khasi Hills, Meghalaya 793113",
    geo: { lat: 25.2013, lng: 91.9147 },
    description:
      "Bamboo-and-timber cottages in Asia's cleanest village, Mawlynnong, a short walk from the living root bridge, run by the local village cooperative.",
    propertyType: "homestay",
    amenities: ["Village-run cooperative", "Walk to living root bridge", "Local Khasi meals"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "dirang-valley-resort-arunachal",
    name: "Dirang Valley Resort",
    destination: "Arunachal Pradesh",
    address: "Old Dirang, West Kameng District, Arunachal Pradesh 790101",
    geo: { lat: 27.3567, lng: 92.2377 },
    description:
      "An apple-orchard resort in Dirang on the Tawang route, popular as an acclimatization stop, with hot-water river springs nearby.",
    propertyType: "resort",
    amenities: ["Apple orchard", "Bonfire", "Hot water springs nearby", "Permit assistance desk"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
  {
    slug: "tawang-monastery-view-lodge",
    name: "Monastery View Lodge",
    destination: "Arunachal Pradesh",
    address: "Near Tawang Monastery, Tawang, Arunachal Pradesh 790104",
    geo: { lat: 27.5860, lng: 91.8594 },
    description:
      "A simple, well-heated lodge with direct views of Tawang Monastery, the largest in India, popular with pilgrims and Northeast circuit travelers alike.",
    propertyType: "hotel",
    amenities: ["Monastery view", "Room heater", "Hot water 24 hrs", "Local guide desk"],
    starRating: 3,
    isActive: true,
    homepageMode: "auto",
  },
] as const;

/**
 * Room types — mixes both pricing models deliberately, and mixes
 * b2bEnabled on/off per room type so the pricing engine has real variety
 * to handle from the start (spec section 5.2).
 */
export const roomTypesSeed = [
  // PineCrest, Aritar (per_night, B2B on)
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

  // Yumthang Valley Eco Resort (per_person_per_night, B2B on)
  {
    propertySlug: "yumthang-valley-eco-resort",
    name: "Riverside Cottage",
    pricingModel: "per_person_per_night",
    maxOccupancy: 4,
    basePriceB2C: 2200,
    basePriceB2B: 1800,
    totalInventory: 10,
  },

  // Windamere Heritage Stay (per_night, B2B on)
  {
    propertySlug: "windamere-heritage-darjeeling",
    name: "Garden View Room",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 7200,
    basePriceB2B: 5900,
    totalInventory: 8,
  },
  {
    propertySlug: "windamere-heritage-darjeeling",
    name: "Heritage Suite",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 11500,
    basePriceB2B: 9400,
    totalInventory: 2,
  },

  // Glenary Family Homestay (per_person_per_night, B2B off — small homestay, B2C only)
  {
    propertySlug: "glenary-homestay-darjeeling",
    name: "Family Room (meals included)",
    pricingModel: "per_person_per_night",
    maxOccupancy: 4,
    basePriceB2C: 1800,
    basePriceB2B: 1800, // same as B2C since this property has b2b disabled at property level
    totalInventory: 4,
  },

  // Pine Ridge Homestay (per_person_per_night, B2B off)
  {
    propertySlug: "kalimpong-pine-ridge-homestay",
    name: "Valley View Room",
    pricingModel: "per_person_per_night",
    maxOccupancy: 3,
    basePriceB2C: 1600,
    basePriceB2B: 1600,
    totalInventory: 5,
  },

  // Ridge Boutique Hotel, Shillong (per_night, B2B on)
  {
    propertySlug: "shillong-ridge-boutique-hotel",
    name: "Deluxe Room",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 5200,
    basePriceB2B: 4100,
    totalInventory: 12,
  },
  {
    propertySlug: "shillong-ridge-boutique-hotel",
    name: "Executive Room with City View",
    pricingModel: "per_night",
    maxOccupancy: 3,
    basePriceB2C: 7000,
    basePriceB2B: 5600,
    totalInventory: 4,
  },

  // Living Root Cottages, Mawlynnong (per_person_per_night, B2B off)
  {
    propertySlug: "mawlynnong-living-root-cottages",
    name: "Bamboo Cottage",
    pricingModel: "per_person_per_night",
    maxOccupancy: 3,
    basePriceB2C: 1400,
    basePriceB2B: 1400,
    totalInventory: 6,
  },

  // Dirang Valley Resort (per_night, B2B on)
  {
    propertySlug: "dirang-valley-resort-arunachal",
    name: "Orchard View Room",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 4800,
    basePriceB2B: 3900,
    totalInventory: 8,
  },

  // Monastery View Lodge, Tawang (per_night, B2B on)
  {
    propertySlug: "tawang-monastery-view-lodge",
    name: "Monastery View Room",
    pricingModel: "per_night",
    maxOccupancy: 2,
    basePriceB2C: 3800,
    basePriceB2B: 3100,
    totalInventory: 10,
  },
] as const;

/**
 * Property-level B2B toggle — demonstrates that B2B can be on for some
 * properties and off for others, layered under the global SiteSettings.b2bEnabled
 * master switch (spec section 5.10).
 */
export const propertyB2BFlags: Record<string, boolean> = {
  "pinecrest-aritar": true,
  "yumthang-valley-eco-resort": true,
  "windamere-heritage-darjeeling": true,
  "glenary-homestay-darjeeling": false,
  "kalimpong-pine-ridge-homestay": false,
  "shillong-ridge-boutique-hotel": true,
  "mawlynnong-living-root-cottages": false,
  "dirang-valley-resort-arunachal": true,
  "tawang-monastery-view-lodge": true,
};

/**
 * Seasonal rate override example (spec section 5.2) — Yumthang gets a peak
 * winter surcharge for snowfall season, Tawang gets a Losar festival surcharge.
 * Use these to test the RatePlans override logic against basePrice.
 */
export const ratePlansSeed = [
  {
    propertySlug: "yumthang-valley-eco-resort",
    roomTypeName: "Riverside Cottage",
    label: "Winter Snowfall Season",
    startDate: "2026-12-15",
    endDate: "2027-02-15",
    b2cRate: 2800,
    b2bRate: 2300,
  },
  {
    propertySlug: "tawang-monastery-view-lodge",
    roomTypeName: "Monastery View Room",
    label: "Losar Festival Surcharge",
    startDate: "2027-02-16",
    endDate: "2027-02-22",
    b2cRate: 4600,
    b2bRate: 3800,
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
  accentColor: "#B5533C", // placeholder muted terracotta — swap for your brand color
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
