"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CompleteRegistrationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/complete-google-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, consent }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrorMessage(typeof body?.error === "string" ? body.error : "Failed to complete signup.");
        setIsSubmitting(false);
        return;
      }

      // Account now exists — finish the Google sign-in to establish a session.
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>One more step</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>
                This link is missing a token.{" "}
                <Link href="/login" className="underline">
                  Go to login
                </Link>{" "}
                to try Continue with Google again.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Accept our Privacy Policy to finish creating your account.
              </p>
              <div className="flex items-start gap-2">
                <Checkbox id="consent" required checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
                <Label htmlFor="consent" className="font-normal">
                  I agree to the{" "}
                  <Link href="/privacy-policy" className="underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {errorMessage}{" "}
                    <Link href="/login" className="underline">
                      Go to login
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Completing signup..." : "Complete signup"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
