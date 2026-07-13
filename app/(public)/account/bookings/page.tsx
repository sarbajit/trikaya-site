import { CalendarX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/app/(public)/_components/EmptyState";
import { BookingsTable, type BookingRow } from "./BookingsTable";

export default async function AccountBookingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await connectDB();
  const bookings = await Booking.find({ userId: session.user.id }).sort({ createdAt: -1 });

  const propertyIds = [...new Set(bookings.map((b) => String(b.propertyId)))];
  const properties = await Property.find({ _id: { $in: propertyIds } }).select("name");
  const propertyNameById = new Map(properties.map((p) => [String(p._id), p.name]));

  const rows: BookingRow[] = bookings.map((booking) => ({
    id: booking._id.toString(),
    propertyName: propertyNameById.get(String(booking.propertyId)) ?? "Property",
    checkIn: formatISODate(booking.checkIn),
    checkOut: formatISODate(booking.checkOut),
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  }));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No bookings yet"
        description="Once you book a stay with us, it'll show up here."
        action={
          <Button asChild size="sm">
            <Link href="/properties">Browse properties</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">Your past and upcoming stays.</p>
      <div className="mt-4">
        <BookingsTable rows={rows} />
      </div>
    </div>
  );
}
