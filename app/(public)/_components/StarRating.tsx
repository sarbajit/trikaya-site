import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  className?: string;
}

export function StarRating({ rating, className }: StarRatingProps) {
  if (!rating) return null;
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-3.5", i < rating ? "fill-secondary text-secondary" : "fill-transparent text-border")}
        />
      ))}
    </div>
  );
}
