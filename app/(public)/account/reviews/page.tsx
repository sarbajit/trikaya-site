import { MessageSquareHeart } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { Review } from "@/models/Review";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";
import { EmptyState } from "@/app/(public)/_components/EmptyState";
import { StarRating } from "@/app/(public)/_components/StarRating";
import { WriteReviewDialog } from "./WriteReviewDialog";

export default async function AccountReviewsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await connectDB();

  const [reviews, completedBookings] = await Promise.all([
    Review.find({ userId: session.user.id }).sort({ createdAt: -1 }),
    Booking.find({ userId: session.user.id, status: "completed" }).sort({ checkOut: -1 }),
  ]);

  const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId.toString()));
  const eligibleBookings = completedBookings.filter((b) => !reviewedBookingIds.has(b._id.toString()));

  const propertyIds = [
    ...new Set([...reviews.map((r) => String(r.propertyId)), ...eligibleBookings.map((b) => String(b.propertyId))]),
  ];
  const properties = await Property.find({ _id: { $in: propertyIds } }).select("name");
  const propertyNameById = new Map(properties.map((p) => [String(p._id), p.name]));

  const hasNothing = reviews.length === 0 && eligibleBookings.length === 0;

  if (hasNothing) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No reviews yet"
        description="Once you complete a stay with us, you'll be able to leave a review here."
        action={
          <Link href="/account/bookings" className="text-sm font-medium text-primary hover:underline">
            View your bookings
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {eligibleBookings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Awaiting your review</h2>
          <div className="mt-3 flex flex-col gap-3">
            {eligibleBookings.map((booking) => (
              <Card key={booking._id.toString()}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <span className="font-medium text-foreground">
                    {propertyNameById.get(String(booking.propertyId)) ?? "Property"}
                  </span>
                  <WriteReviewDialog
                    bookingId={booking._id.toString()}
                    propertyName={propertyNameById.get(String(booking.propertyId)) ?? "this property"}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">Your reviews</h2>
          <div className="mt-3 flex flex-col gap-3">
            {reviews.map((review) => (
              <Card key={review._id.toString()}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-foreground">
                      {propertyNameById.get(String(review.propertyId)) ?? "Property"}
                    </span>
                    <StatusBadge status={review.status as AdminStatus} />
                  </div>
                  <StarRating rating={review.rating} className="mt-2" />
                  <p className="mt-2 text-sm text-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
