import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBookingQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
import { bookingQuoteRequestSchema } from "@/lib/validation/booking";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bookingQuoteRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();

  try {
    const quote = await getBookingQuote({ ...parsed.data, session });
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof RoomTypeNotFoundError) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }
    if (error instanceof InvalidQuoteRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
