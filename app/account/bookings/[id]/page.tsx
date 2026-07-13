import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessBooking } from "@/lib/booking-authorization";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { Booking, type BookingStatus } from "@/models/Booking";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_BADGE: Record<BookingStatus, { variant: "success" | "default" | "destructive" | "muted"; label: string }> = {
  pending: { variant: "default", label: "Pending" },
  confirmed: { variant: "success", label: "Confirmed" },
  cancelled: { variant: "destructive", label: "Cancelled" },
  completed: { variant: "muted", label: "Completed" },
};

export default async function AccountBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) {
    notFound();
  }

  if (!canAccessBooking(session, booking)) {
    redirect("/");
  }

  const roomTypeIds = [...new Set(booking.rooms.map((room) => String(room.roomTypeId)))];
  const [property, roomTypes] = await Promise.all([
    Property.findById(booking.propertyId).select("name slug"),
    RoomType.find({ _id: { $in: roomTypeIds } }).select("name"),
  ]);
  const roomTypeNameById = new Map(roomTypes.map((rt) => [String(rt._id), rt.name]));

  const statusBadge = STATUS_BADGE[booking.status];
  const canDownloadInvoice = booking.status === "confirmed" && Boolean(booking.swipeInvoiceId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Booking details</h1>
      <p className="mt-1 text-sm text-muted-foreground">Reference {booking._id.toString()}</p>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{property?.name ?? "Property"}</CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-2 text-sm">
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
            <span className="font-medium text-foreground">Total paid</span>
            <span className="font-semibold text-foreground">
              {booking.currency} {booking.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {canDownloadInvoice ? (
            <Button asChild className="mt-6 w-full">
              <a href={`/api/bookings/${booking._id.toString()}/invoice`}>Download invoice</a>
            </Button>
          ) : (
            <Alert className="mt-6">
              <AlertDescription>
                {booking.status === "confirmed"
                  ? "Your invoice is still being generated — check back shortly."
                  : "An invoice will be available once this booking is confirmed."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
