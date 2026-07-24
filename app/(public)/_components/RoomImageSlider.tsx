"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyPhoto } from "./PropertyPhoto";
import { cn } from "@/lib/utils";

type Slide = { url: string; alt: string } | null;

interface RoomImageSliderProps {
  images: Array<{ url: string; alt: string }>;
  seedKey: string;
  className?: string;
}

/**
 * Manual (no autoplay) crossfading slider for a room type's photos, used in
 * the room details modal. Falls back to PropertyPhoto's generated placeholder
 * art when no images are available, same as HeroSlider/PropertyGallery.
 */
export function RoomImageSlider({ images, seedKey, className }: RoomImageSliderProps) {
  const slides: Slide[] = images.length > 0 ? images : [null];
  const [index, setIndex] = useState(0);

  function goTo(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  return (
    <div className={cn("relative isolate overflow-hidden rounded-md bg-muted", className)}>
      {slides.map((image, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-300 ease-in-out",
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={i !== index}
        >
          <PropertyPhoto image={image} seedKey={`${seedKey}-${i}`} alt={image?.alt ?? ""} className="h-full w-full" />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5 px-4">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index}
                className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === index ? "bg-white" : "bg-white/40")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
