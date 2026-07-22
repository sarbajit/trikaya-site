import type { CSSProperties } from "react";

/**
 * Hero sections render text over an admin-uploaded photo (or generated
 * placeholder art) of unpredictable brightness/color. Overriding the neutral
 * tokens locally to light values (rather than hardcoding text-white on every
 * element) keeps text legible regardless of the photo while still letting
 * `text-foreground`, `text-muted-foreground`, etc. cascade normally.
 */
export const HERO_TEXT_STYLE = {
  "--color-foreground": "#ffffff",
  "--color-muted-foreground": "rgba(255,255,255,0.75)",
  "--color-border": "rgba(255,255,255,0.4)",
  textShadow: "0 2px 12px rgba(0,0,0,0.55)",
} as CSSProperties;
