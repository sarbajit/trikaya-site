import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  count?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, count, showValue, className }: StarRatingProps) {
  if (!rating) return null;
  const filled = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-3.5", i < filled ? "fill-secondary text-secondary" : "fill-transparent text-border")}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
          {count != null ? ` (${count})` : ""}
        </span>
      )}
    </div>
  );
}
