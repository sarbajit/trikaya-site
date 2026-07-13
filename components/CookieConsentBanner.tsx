"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getOrCreateAnonId, getStoredConsent, setStoredConsent } from "@/lib/consent-cookie";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

  async function save(categories: { analytics: boolean; marketing: boolean }) {
    setStoredConsent(categories);
    setVisible(false);

    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getOrCreateAnonId(), categories }),
      });
    } catch {
      // Preference is already saved client-side; the audit-log write can be retried
      // on the next visit if this fails, so a network error here isn't user-facing.
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/98 p-4 shadow-lg backdrop-blur sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-display text-base text-foreground">We value your privacy</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We use necessary cookies to run this site, and optional analytics/marketing cookies to improve it.
              Non-essential cookies stay off until you say yes — see our{" "}
              <a href="/privacy-policy" className="underline hover:text-primary">
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          </div>
        </div>

        {customizing && (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <Checkbox checked disabled />
              <Label className="font-normal text-foreground">Necessary (always on)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={analytics} onCheckedChange={(c) => setAnalytics(c === true)} id="consent-analytics" />
              <Label htmlFor="consent-analytics" className="font-normal">
                Analytics
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={marketing} onCheckedChange={(c) => setMarketing(c === true)} id="consent-marketing" />
              <Label htmlFor="consent-marketing" className="font-normal">
                Marketing
              </Label>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {customizing ? (
            <Button type="button" onClick={() => save({ analytics, marketing })}>
              Save preferences
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setCustomizing(true)}>
                Customize
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => save({ analytics: false, marketing: false })}
              >
                Reject non-essential
              </Button>
              <Button type="button" size="sm" onClick={() => save({ analytics: true, marketing: true })}>
                Accept all
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
