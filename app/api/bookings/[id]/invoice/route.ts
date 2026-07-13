import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessBooking } from "@/lib/booking-authorization";
import { connectDB } from "@/lib/db";
import { getSwipeInvoicePdf } from "@/lib/swipe";
import { Booking } from "@/models/Booking";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!canAccessBooking(session, booking)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!booking.swipeInvoiceId) {
    return NextResponse.json({ error: "Invoice not available for this booking" }, { status: 404 });
  }

  const pdf = await getSwipeInvoicePdf(booking.swipeInvoiceId);
  if (!pdf) {
    return NextResponse.json({ error: "Invoice not available" }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${booking.invoiceNumber ?? booking._id}.pdf"`,
    },
  });
}
