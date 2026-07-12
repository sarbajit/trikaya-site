"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const justRegistered = searchParams.get("registered") === "1";
  const accessDenied = searchParams.get("error") === "AccessDenied";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setShowResend(false);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        if (result.code === "email-not-verified") {
          setErrorMessage("Please verify your email address before logging in.");
          setShowResend(true);
        } else {
          setErrorMessage("Invalid email or password.");
        }
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendSent(false);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          {justRegistered && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>Account created. Check your email to verify your address.</AlertDescription>
            </Alert>
          )}
          {accessDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>This Google account can&apos;t be used to sign in here.</AlertDescription>
            </Alert>
          )}

          {googleEnabled && (
            <div className="mb-4 flex flex-col gap-4">
              <GoogleSignInButton callbackUrl={callbackUrl} />
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage}
                  {showResend && (
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleResend}>
                        Resend verification email
                      </Button>
                      {resendSent && <p className="mt-1 text-xs">Verification email sent.</p>}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="underline">
              Forgot password?
            </Link>
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
