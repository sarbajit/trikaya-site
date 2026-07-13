"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactFormState = { name: "", email: "", message: "" };

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? { form: ["Failed to send message"] });
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
        <CheckCircle2 className="size-8 text-primary" aria-hidden />
        <p className="font-display text-lg text-foreground">Message sent</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Thanks for reaching out — we&apos;ll get back to you as soon as we can.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Name" htmlFor="contact-name" error={errors?.name} required>
        <Input id="contact-name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </FormField>
      <FormField label="Email" htmlFor="contact-email" error={errors?.email} required>
        <Input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </FormField>
      <FormField label="Message" htmlFor="contact-message" error={errors?.message} required>
        <Textarea
          id="contact-message"
          rows={6}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          required
        />
      </FormField>

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form.join(", ")}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
