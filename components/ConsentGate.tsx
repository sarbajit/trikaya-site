"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getStoredConsent } from "@/lib/consent-cookie";

type ConsentCategory = "analytics" | "marketing";

// Any future analytics/marketing script (GA, Meta Pixel, etc.) must be loaded through
// this gate — nothing outside "necessary" may run before the user has chosen.
export function hasConsent(category: ConsentCategory): boolean {
  const consent = getStoredConsent();
  return consent?.[category] === true;
}

export function ConsentGate({ category, children }: { category: ConsentCategory; children: ReactNode }) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(hasConsent(category));
  }, [category]);

  if (!granted) return null;
  return <>{children}</>;
}
