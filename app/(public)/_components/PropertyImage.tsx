import { buildContourArt } from "@/lib/placeholder-art";
import { cn } from "@/lib/utils";

interface PropertyImageProps {
  seedKey: string;
  alt: string;
  className?: string;
  caption?: string;
}

/**
 * Stands in for a real photo (Cloudinary uploads land with admin property
 * CRUD in Phase 6). Renders a deterministic topographic-contour illustration
 * so every property/room has a distinct, on-brand "image" instead of a
 * generic gradient block or an external stock photo.
 */
export function PropertyImage({ seedKey, alt, className, caption }: PropertyImageProps) {
  const art = buildContourArt(seedKey);
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative isolate overflow-hidden bg-muted", className)}
    >
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="400" height="300" fill="var(--color-muted)" />
        <g style={{ transform: `rotate(${art.rotation}deg)`, transformOrigin: "200px 150px" }}>
          {art.rings.map((ring, i) => (
            <path
              key={i}
              d={ring.d}
              fill={i === art.rings.length - 1 ? "var(--color-primary)" : "none"}
              fillOpacity={i === art.rings.length - 1 ? 0.16 : 0}
              stroke={i % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)"}
              strokeOpacity={ring.opacity * 0.55}
              strokeWidth={1.2}
            />
          ))}
        </g>
      </svg>
      {caption && (
        <span className="absolute bottom-2 left-2 rounded-sm bg-background/85 px-2 py-0.5 text-[11px] font-medium tracking-wide text-foreground">
          {caption}
        </span>
      )}
    </div>
  );
}
