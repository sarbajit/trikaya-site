"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyPhoto } from "./PropertyPhoto";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

interface HeroSliderProps {
  images: Array<{ url: string; alt: string } | null>;
  seedKey: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Full-bleed crossfading hero slider shared by every homepage variant. Falls
 * back to PropertyPhoto's generated placeholder art per-slide when an entry
 * is null, so unphotographed properties/sites still get on-brand imagery.
 */
export function HeroSlider({ images, seedKey, className, children }: HeroSliderProps) {
  const slides = images.length > 0 ? images : [null];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
    // Re-running on every `index` change (including manual nav) restarts the
    // countdown, so a manual click always buys a fresh AUTOPLAY_MS before the
    // next auto-advance rather than firing right away.
  }, [slides.length, paused, index]);

  function goTo(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      onMouseEnter={() => setPaused(false)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(false)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((image, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
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
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-1.5 px-4">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="h-1 w-8 overflow-hidden rounded-full bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  key={i === index ? index : "inactive"}
                  className={cn(
                    "block h-full rounded-full bg-white transition-transform duration-300 ease-out",
                    i === index ? "translate-x-0" : "-translate-x-full"
                  )}
                  style={
                    i === index && !paused
                      ? { animation: `hero-slide-progress ${AUTOPLAY_MS}ms linear` }
                      : undefined
                  }
                />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
