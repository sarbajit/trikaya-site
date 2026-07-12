"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgentForm {
  businessName: string;
  gstin: string;
  contactPerson: string;
  email: string;
  phone: string;
  password: string;
  consent: boolean;
}

const initialForm: AgentForm = {
  businessName: "",
  gstin: "",
  contactPerson: "",
  email: "",
  phone: "",
  password: "",
  consent: false,
};

export function AgentRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<AgentForm>(initialForm);
  const [proofDocUrls, setProofDocUrls] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function update<K extends keyof AgentForm>(key: K, value: AgentForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDoc(index: number, url: string) {
    setProofDocUrls((prev) => prev.map((existing, i) => (i === index ? url : existing)));
  }

  function removeDoc(index: number) {
    setProofDocUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addDoc() {
    setProofDocUrls((prev) => [...prev, ""]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    const filteredDocUrls = proofDocUrls.filter((url) => url.trim().length > 0);
    if (filteredDocUrls.length === 0) {
      setErrors({ proofDocUrls: ["Upload at least one business-proof document"] });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/agent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gstin: form.gstin || undefined, proofDocUrls: filteredDocUrls }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? { form: ["Registration failed"] });
        return;
      }

      router.push("/agent/login?agentRegistered=1");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Register as a B2B agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gstin">GSTIN (optional)</Label>
              <Input id="gstin" value={form.gstin} onChange={(e) => update("gstin", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input
                id="contactPerson"
                value={form.contactPerson}
                onChange={(e) => update("contactPerson", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Business-proof documents</Label>
              {proofDocUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CloudinaryUploader
                    folder="agents"
                    resourceType="auto"
                    accept="image/*,application/pdf"
                    value={url}
                    onChange={(value) => updateDoc(index, value)}
                  />
                  {proofDocUrls.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(index)}>
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addDoc}>
                <Plus />
                Add another document
              </Button>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="consent"
                required
                checked={form.consent}
                onCheckedChange={(checked) => update("consent", checked === true)}
              />
              <Label htmlFor="consent" className="font-normal">
                I agree to the{" "}
                <Link href="/privacy-policy" className="underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {errors && (
              <Alert variant="destructive">
                <AlertDescription>
                  {Object.entries(errors).map(([field, messages]) => (
                    <div key={field}>{messages.join(", ")}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit application"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an agent account?{" "}
            <Link href="/agent/login" className="underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
