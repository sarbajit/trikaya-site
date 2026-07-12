import { MessageSquareHeart } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { StarRating } from "./StarRating";
import { EmptyState } from "./EmptyState";

export async function ReviewsSection({ propertyId }: { propertyId: string }) {
  await connectDB();
  const reviews = await Review.find({ propertyId, status: "approved" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("userId", "name")
    .lean();

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No reviews yet"
        description="Be the first guest to share how your stay went — reviews open up once bookings do."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reviews.map((review) => {
        const author = (review.userId as unknown as { name?: string } | null)?.name ?? "Verified guest";
        return (
          <div key={review._id.toString()} className="rounded-md border border-border bg-card p-4">
            <StarRating rating={review.rating} />
            <p className="mt-2 text-sm text-foreground">{review.comment}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{author}</p>
          </div>
        );
      })}
    </div>
  );
}
