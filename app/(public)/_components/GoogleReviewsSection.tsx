"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareHeart } from "lucide-react";
import type { IGoogleReview } from "@/models/Property";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5000;

export function GoogleReviewsSection({
  reviews,
  googlePlaceId,
}: {
  reviews?: IGoogleReview[];
  googlePlaceId?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = reviews?.length ?? 0;

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
    // Re-running on every `index` change (including manual nav) restarts the
    // countdown, so a manual click always buys a fresh AUTOPLAY_MS before the
    // next auto-advance rather than firing right away.
  }, [count, paused, index]);

  if (!googlePlaceId || !reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No Google reviews yet"
        description="Reviews from this property's Google Business Profile will appear here once available."
      />
    );
  }

  function goTo(next: number) {
    setIndex(((next % count) + count) % count);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {reviews.map((review, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <div className="rounded-md border border-border bg-card p-4 sm:min-h-48">
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
              </div>
            ))}
          </div>
        </div>

        {reviews.length > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => goTo(index - 1)}
              aria-label="Previous review"
              className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => goTo(index + 1)}
              aria-label="Next review"
              className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {reviews.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to review ${i + 1}`}
              aria-current={i === index}
              className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === index ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      )}

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
