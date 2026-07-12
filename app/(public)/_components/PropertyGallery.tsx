"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { PropertyImage } from "./PropertyImage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const TILE_COUNT = 5;

export function PropertyGallery({ slug, name }: { slug: string; name: string }) {
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => `${slug}-gallery-${i}`);

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-lg" style={{ height: 420 }}>
        <button
          type="button"
          className="group relative col-span-2 row-span-2 cursor-zoom-in"
          onClick={() => setActiveTile(0)}
        >
          <PropertyImage seedKey={tiles[0]} alt={`${name} — main view`} className="h-full w-full" />
          <span className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        </button>
        {tiles.slice(1).map((seed, i) => (
          <button
            type="button"
            key={seed}
            className="group relative col-span-1 row-span-1 cursor-zoom-in"
            onClick={() => setActiveTile(i + 1)}
          >
            <PropertyImage seedKey={seed} alt={`${name} — view ${i + 2}`} className="h-full w-full" />
            <span className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
            {i === tiles.length - 2 && (
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-background/90 px-2 py-1 text-[11px] font-medium">
                <Expand className="size-3" /> View all
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={activeTile !== null} onOpenChange={(open) => !open && setActiveTile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{name}</DialogTitle>
          {activeTile !== null && (
            <PropertyImage
              seedKey={tiles[activeTile]}
              alt={`${name} — view ${activeTile + 1}`}
              className="mt-2 aspect-[4/3] w-full rounded-md"
            />
          )}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {tiles.map((seed, i) => (
              <button
                type="button"
                key={seed}
                onClick={() => setActiveTile(i)}
                className={`size-14 shrink-0 overflow-hidden rounded-sm ring-2 transition-[ring] ${
                  i === activeTile ? "ring-primary" : "ring-transparent"
                }`}
              >
                <PropertyImage seedKey={seed} alt="" className="h-full w-full" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
