export const BOOKING_SOURCES = ["direct", "agent", "website", "ota"] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  direct: "Direct",
  agent: "Agent",
  website: "Website",
  ota: "OTA",
};
