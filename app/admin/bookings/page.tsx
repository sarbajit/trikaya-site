import Link from "next/link";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../_components/PageHeader";
import { BookingsTable, type BookingRow } from "./BookingsTable";

export default async function AdminBookingsPage() {
  await connectDB();
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .populate("agentId", "contactPerson email")
    .limit(500);

  const propertyIds = [...new Set(bookings.map((b) => String(b.propertyId)))];
  const properties = await Property.find({ _id: { $in: propertyIds } }).select("name");
  const propertyNameById = new Map(properties.map((p) => [String(p._id), p.name]));

  const rows: BookingRow[] = bookings.map((booking) => {
    const user = booking.userId as unknown as { name?: string; email?: string } | null;
    const agent = booking.agentId as unknown as { contactPerson?: string; email?: string } | null;
    return {
      id: booking._id.toString(),
      propertyName: propertyNameById.get(String(booking.propertyId)) ?? "Property",
      guestName: user?.name ?? agent?.contactPerson ?? "—",
      guestEmail: user?.email ?? agent?.email ?? "",
      checkIn: formatISODate(booking.checkIn),
      checkOut: formatISODate(booking.checkOut),
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      status: booking.status,
      source: booking.source,
      createdAt: booking.createdAt.toISOString(),
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Bookings"
        description="All bookings across every property, most recent first."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/bookings/calendar">View calendar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/bookings/new">New booking</Link>
            </Button>
          </>
        }
      />
      <div className="mt-8">
        <BookingsTable rows={rows} />
      </div>
    </div>
  );
}
