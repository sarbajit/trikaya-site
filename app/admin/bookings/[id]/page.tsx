import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingActions } from "../_components/BookingActions";
import { BookingSourceNotesEditor } from "../_components/BookingSourceNotesEditor";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectDB();
  const booking = await Booking.findById(id)
    .populate("userId", "name email phone")
    .populate("agentId", "contactPerson email phone businessName");
  if (!booking) {
    notFound();
  }

  const user = booking.userId as unknown as { name?: string; email?: string; phone?: string } | null;
  const agent = booking.agentId as unknown as { contactPerson?: string; email?: string; phone?: string; businessName?: string } | null;
  const guestName = user?.name ?? agent?.contactPerson ?? "—";
  const guestEmail = user?.email ?? agent?.email ?? "";
  const guestPhone = user?.phone ?? agent?.phone ?? "";

  const roomTypeIds = [...new Set(booking.rooms.map((room) => String(room.roomTypeId)))];
  const [property, roomTypes] = await Promise.all([
    Property.findById(booking.propertyId).select("name"),
    RoomType.find({ _id: { $in: roomTypeIds } }).select("name"),
  ]);
  const roomTypeNameById = new Map(roomTypes.map((rt) => [String(rt._id), rt.name]));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to bookings
      </Link>
      <p className="mt-3 text-sm text-muted-foreground">Reference {booking._id.toString()}</p>

      <Card className="mt-2">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{property?.name ?? "Property"}</CardTitle>
          <StatusBadge status={booking.status} />
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Guest</dt>
              <dd className="font-medium text-foreground">
                {guestName}
                {guestEmail && <span className="ml-2 text-muted-foreground">{guestEmail}</span>}
              </dd>
            </div>
            {guestPhone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium text-foreground">{guestPhone}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dates</dt>
              <dd className="font-medium text-foreground">
                {formatISODate(booking.checkIn)} &rarr; {formatISODate(booking.checkOut)}
              </dd>
            </div>
            {booking.invoiceNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Invoice number</dt>
                <dd className="font-medium text-foreground">{booking.invoiceNumber}</dd>
              </div>
            )}
          </dl>

          {booking.guestNote && (
            <div className="mt-4 rounded-md border border-dashed border-border p-3 text-sm">
              <p className="font-medium text-foreground">Guest note</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{booking.guestNote}</p>
            </div>
          )}

          <div className="mt-4">
            <BookingSourceNotesEditor
              bookingId={booking._id.toString()}
              source={booking.source}
              internalNotes={booking.internalNotes}
            />
          </div>

          <div className="mt-5 flex flex-col gap-5">
            {booking.rooms.map((room, index) => {
              const isPerPerson = room.pricingModel === "per_person_per_night";
              const hasChildren = room.childAges.length > 0;
              return (
                <div key={index} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">
                      {roomTypeNameById.get(String(room.roomTypeId)) ?? "Room"}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {room.adults} adult{room.adults > 1 ? "s" : ""}
                      {hasChildren ? `, ${room.childAges.length} child${room.childAges.length > 1 ? "ren" : ""}` : ""}
                    </span>
                  </div>

                  <Table className="mt-3">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Night</TableHead>
                        {isPerPerson && <TableHead className="text-right">Adult rate</TableHead>}
                        {isPerPerson && hasChildren && <TableHead className="text-right">Child rate</TableHead>}
                        <TableHead className="text-right">{isPerPerson ? "Amount" : "Rate"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {room.nightlyRates.map((night) => (
                        <TableRow key={night.date}>
                          <TableCell>{night.date}</TableCell>
                          {isPerPerson && (
                            <TableCell className="text-right">
                              {booking.currency} {night.adultRate.toLocaleString("en-IN")}
                            </TableCell>
                          )}
                          {isPerPerson && hasChildren && (
                            <TableCell className="text-right">
                              {booking.currency} {night.childRate.toLocaleString("en-IN")}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            {booking.currency} {night.amount.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Room subtotal</span>
                    <span className="font-medium text-foreground">
                      {booking.currency} {room.roomTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between border-t border-border pt-3 text-base">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-semibold text-foreground">
              {booking.currency} {booking.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {booking.status === "requested" && (
            <div className="mt-6">
              <BookingActions bookingId={booking._id.toString()} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
