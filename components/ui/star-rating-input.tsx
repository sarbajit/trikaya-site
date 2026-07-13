"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function StarRatingInput({ value, onChange, className }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayed = hovered ?? value;

  return (
    <div role="radiogroup" aria-label="Rating" className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className="p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                starValue <= displayed ? "fill-secondary text-secondary" : "fill-transparent text-border"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
