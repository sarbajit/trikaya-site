import Image from "next/image";
import { PropertyImage } from "./PropertyImage";
import { cn } from "@/lib/utils";

interface PropertyPhotoProps {
  image?: { url: string; alt: string } | null;
  seedKey: string;
  alt: string;
  className?: string;
  caption?: string;
}

/**
 * Renders a real uploaded photo when one is available, falling back to the
 * generated placeholder art (PropertyImage) otherwise — so unphotographed
 * properties/rooms still get a distinct, on-brand "image".
 */
export function PropertyPhoto({ image, seedKey, alt, className, caption }: PropertyPhotoProps) {
  if (image?.url) {
    return (
      <div className={cn("relative isolate overflow-hidden bg-muted", className)}>
        <Image
          src={image.url}
          alt={image.alt || alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        {caption && (
          <span className="absolute bottom-2 left-2 rounded-sm bg-background/85 px-2 py-0.5 text-[11px] font-medium tracking-wide text-foreground">
            {caption}
          </span>
        )}
      </div>
    );
  }
  return <PropertyImage seedKey={seedKey} alt={alt} className={className} caption={caption} />;
}
