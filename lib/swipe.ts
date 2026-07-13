/**
 * Swipe (getswipe.in) billing integration — spec §5.5 delegates invoice
 * generation/numbering/PDF to Swipe rather than building our own. Our
 * company/seller profile (name, address, GSTIN, place of supply) lives in
 * the Swipe account itself; we only ever send the buyer (`party`) and line
 * items here.
 *
 * API reference: https://developers.getswipe.in (partner v2 "document" API).
 * Not hands-on tested against a live key — if Swipe's actual request/response
 * shape differs, adjust against the API Playground.
 */

import type { IBooking } from "@/models/Booking";
import type { IProperty } from "@/models/Property";

const BASE_URL = "https://app.getswipe.in/api/partner/v2";

function getApiKey(): string | null {
  const key = process.env.SWIPE_API_KEY;
  if (!key) {
    console.warn("SWIPE_API_KEY not set — skipping Swipe invoice call");
    return null;
  }
  return key;
}

function formatDDMMYYYY(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export interface SwipeBuyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gstin?: string;
}

export interface CreateSwipeInvoiceInput {
  booking: Pick<IBooking, "_id" | "rooms" | "totalAmount" | "currency">;
  property: Pick<IProperty, "name">;
  /** Room type name per roomTypeId (stringified), for line-item labels. */
  roomTypeNames: Map<string, string>;
  buyer: SwipeBuyer;
}

export interface SwipeInvoiceResult {
  hashId: string;
  serialNumber: string;
}

interface SwipeDocResponse {
  success: boolean;
  message?: string;
  error_code?: string;
  data?: {
    hash_id: string;
    serial_number: string;
  };
}

/**
 * Creates an "invoice" document in Swipe for a confirmed booking. One line
 * item per room per stayed night, using each room's snapshotted per-night
 * amount (already accounts for adults/children/age-banding — see
 * Booking.rooms[].nightlyRates[].amount) so nothing here re-derives pricing.
 */
export async function createSwipeInvoice(input: CreateSwipeInvoiceInput): Promise<SwipeInvoiceResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const { booking, property, roomTypeNames, buyer } = input;

  const items = booking.rooms.flatMap((room, roomIndex) => {
    const roomTypeName = roomTypeNames.get(String(room.roomTypeId)) ?? "Room";
    return room.nightlyRates.map((night) => ({
      id: `${booking._id}-${roomIndex}-${night.date}`,
      name: `${property.name} — ${roomTypeName} (${night.date})`,
      quantity: 1,
      unit_price: night.amount,
      price_with_tax: night.amount,
      net_amount: night.amount,
      total_amount: night.amount,
      item_type: "Service",
    }));
  });

  const body = {
    document_type: "invoice",
    document_date: formatDDMMYYYY(new Date()),
    reference: String(booking._id),
    party: {
      id: buyer.id,
      type: "customer",
      name: buyer.name,
      email: buyer.email,
      phone_number: buyer.phone,
      gstin: buyer.gstin,
    },
    items,
  };

  const response = await fetch(`${BASE_URL}/doc`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as SwipeDocResponse;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(`Swipe invoice creation failed: ${json.message ?? response.statusText}`);
  }

  return { hashId: json.data.hash_id, serialNumber: json.data.serial_number };
}

export async function getSwipeInvoicePdf(hashId: string): Promise<Buffer | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await fetch(`${BASE_URL}/doc/pdf/${hashId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Swipe invoice PDF fetch failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Cancels a Swipe document. Not called from any route yet — a primitive for
 * the future admin cancel/refund feature (spec §5.10), which doesn't exist
 * in this codebase yet.
 */
export async function cancelSwipeDocument(hashId: string): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const response = await fetch(`${BASE_URL}/doc/${hashId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Swipe document cancellation failed: ${response.statusText}`);
  }
}
