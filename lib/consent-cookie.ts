"use client";

const CONSENT_COOKIE = "trikaya_consent";
const ANON_ID_COOKIE = "trikaya_anon_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export interface ConsentCategories {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getStoredConsent(): ConsentCategories | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.analytics === "boolean" && typeof parsed.marketing === "boolean") {
      return { necessary: true, analytics: parsed.analytics, marketing: parsed.marketing };
    }
  } catch {
    // fall through
  }
  return null;
}

export function setStoredConsent(categories: { analytics: boolean; marketing: boolean }) {
  writeCookie(CONSENT_COOKIE, JSON.stringify({ analytics: categories.analytics, marketing: categories.marketing }), ONE_YEAR_SECONDS);
}

export function getOrCreateAnonId(): string {
  const existing = readCookie(ANON_ID_COOKIE);
  if (existing) return existing;
  const id = crypto.randomUUID();
  writeCookie(ANON_ID_COOKIE, id, ONE_YEAR_SECONDS);
  return id;
}
