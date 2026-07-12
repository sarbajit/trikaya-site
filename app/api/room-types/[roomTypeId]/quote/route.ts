import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRoomTypeQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
import { quoteRequestSchema } from "@/lib/validation/booking";

export async function POST(request: Request, { params }: { params: Promise<{ roomTypeId: string }> }) {
  const { roomTypeId } = await params;

  const json = await request.json().catch(() => null);
  const parsed = quoteRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();

  try {
    const quote = await getRoomTypeQuote({ roomTypeId, ...parsed.data, session });
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
