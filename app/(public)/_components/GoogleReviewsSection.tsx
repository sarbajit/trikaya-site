import { MessageSquareHeart } from "lucide-react";
import type { IGoogleReview } from "@/models/Property";
import { StarRating } from "./StarRating";
import { EmptyState } from "./EmptyState";

export function GoogleReviewsSection({
  reviews,
  googlePlaceId,
}: {
  reviews?: IGoogleReview[];
  googlePlaceId?: string;
}) {
  if (!googlePlaceId || !reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No Google reviews yet"
        description="Reviews from this property's Google Business Profile will appear here once available."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.map((review, index) => (
          <div key={index} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              {review.authorPhotoUrl ? (
                <img
                  src={review.authorPhotoUrl}
                  alt=""
                  className="size-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {review.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{review.authorName}</p>
                <p className="text-xs text-muted-foreground">{review.relativeTime}</p>
              </div>
            </div>
            <StarRating rating={review.rating} className="mt-2" />
            <p className="mt-2 text-sm text-foreground">{review.text}</p>
          </div>
        ))}
      </div>
      <a
        href={`https://search.google.com/local/reviews?placeid=${encodeURIComponent(googlePlaceId)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-xs text-muted-foreground underline"
      >
        Reviews from Google
      </a>
    </div>
  );
}
