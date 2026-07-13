import crypto from "crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (client) return client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
  }

  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

export interface CreateOrderInput {
  amountPaise: number;
  currency: string;
  receipt: string;
}

export async function createOrder(input: CreateOrderInput) {
  const order = await getClient().orders.create({
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
  });
  return order;
}

/**
 * Verifies the `x-razorpay-signature` header against the raw webhook body
 * using RAZORPAY_WEBHOOK_SECRET. Must be called with the raw, unparsed
 * request body — the signature is computed over the exact bytes Razorpay
 * sent, so re-serializing parsed JSON would produce a mismatch.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "RAZORPAY_WEBHOOK_SECRET is not set — every Razorpay webhook will be rejected and bookings will stay 'pending' after payment. Set it to the signing secret configured for this webhook in the Razorpay Dashboard."
    );
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
