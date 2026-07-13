import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { ReviewModerationTable } from "./ReviewModerationTable";
import { PageHeader } from "../_components/PageHeader";

export default async function AdminReviewsPage() {
  await connectDB();
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .populate("propertyId", "name")
    .populate("userId", "name email");

  const initialReviews = reviews.map((review) => {
    const property = review.propertyId as unknown as { name?: string } | null;
    const user = review.userId as unknown as { name?: string; email?: string } | null;
    return {
      id: review._id.toString(),
      propertyName: property?.name ?? "Property",
      guestName: user?.name ?? "Guest",
      guestEmail: user?.email ?? "",
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Reviews moderation"
        description="Approve or reject guest reviews before they appear on property pages."
      />
      <ReviewModerationTable initialReviews={initialReviews} />
    </div>
  );
}
