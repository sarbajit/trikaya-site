"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { DynamicListField } from "./DynamicListField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/hooks/use-toast";

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettingsData {
  companyName: string;
  showCompanyName: boolean;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  socialLinks: SocialLink[];
  contactRecipientEmail: string;
  b2bEnabled: boolean;
  bookingEnabled: boolean;
  invoicePrefix: string;
  taxSettings?: { gstin?: string };
  childMaxAge: number;
}

const DEFAULT_COLORS: Record<"primaryColor" | "secondaryColor" | "accentColor", string> = {
  primaryColor: "#1e3a8a",
  secondaryColor: "#f59e0b",
  accentColor: "#10b981",
};

export function SiteSettingsForm({ initialSettings }: { initialSettings: SiteSettingsData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<SiteSettingsData>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function update<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    const next = [...form.socialLinks];
    next[index] = { ...next[index], [field]: value };
    update("socialLinks", next);
  }

  function removeSocialLink(index: number) {
    update(
      "socialLinks",
      form.socialLinks.filter((_, i) => i !== index)
    );
  }

  function addSocialLink() {
    update("socialLinks", [...form.socialLinks, { platform: "", url: "" }]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrors(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? { form: ["Failed to save settings"] });
        toast({ title: "Failed to save settings", variant: "destructive" });
        return;
      }

      toast({ title: "Settings saved.", variant: "success" });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Company name" htmlFor="companyName" error={errors?.companyName} required>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              required
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Switch
              id="showCompanyName"
              checked={form.showCompanyName}
              onCheckedChange={(checked) => update("showCompanyName", checked)}
            />
            <Label htmlFor="showCompanyName">Show company name next to logo</Label>
          </div>
          <CloudinaryUploader
            folder="logos"
            label="Logo"
            value={form.logoUrl}
            onChange={(url) => update("logoUrl", url)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage</CardTitle>
        </CardHeader>
        <CardContent>
          <CloudinaryUploader
            folder="branding"
            label="Homepage hero image"
            value={form.heroImageUrl}
            onChange={(url) => update("heroImageUrl", url)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Shown at the top of the homepage. Not tied to any property&apos;s gallery — leave empty to fall back to
            the default imagery.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => {
              const currentValue = form[key] || DEFAULT_COLORS[key];
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={key}>{key.replace("Color", "")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={key}
                      type="color"
                      value={currentValue}
                      onChange={(e) => update(key, e.target.value)}
                      className="h-9 w-9 rounded-md border border-input p-0.5"
                    />
                    <Input
                      value={currentValue}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicListField label="Addresses" items={form.addresses} onChange={(items) => update("addresses", items)} />
          <DynamicListField
            label="Phones"
            items={form.phones}
            onChange={(items) => update("phones", items)}
            inputType="tel"
          />
          <DynamicListField
            label="Emails"
            items={form.emails}
            onChange={(items) => update("emails", items)}
            inputType="email"
          />

          <div className="flex flex-col gap-2">
            <Label>Social links</Label>
            {form.socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Platform (e.g. Instagram)"
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                  className="w-40"
                />
                <Input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addSocialLink}>
              <Plus />
              Add social link
            </Button>
          </div>

          <FormField
            label="Contact form recipient email"
            htmlFor="contactRecipientEmail"
            error={errors?.contactRecipientEmail}
            required
          >
            <Input
              id="contactRecipientEmail"
              type="email"
              value={form.contactRecipientEmail}
              onChange={(e) => update("contactRecipientEmail", e.target.value)}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Switch
              id="bookingEnabled"
              checked={form.bookingEnabled}
              onCheckedChange={(checked) => update("bookingEnabled", checked)}
            />
            <Label htmlFor="bookingEnabled">Enable direct booking &amp; payment</Label>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            When disabled, guests see a &quot;Request to Book&quot; form instead of instant payment — bookings must
            be confirmed manually by an admin.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Switch
              id="b2bEnabled"
              checked={form.b2bEnabled}
              onCheckedChange={(checked) => update("b2bEnabled", checked)}
            />
            <Label htmlFor="b2bEnabled">Enable B2B agent rates</Label>
          </div>
          <FormField label="Invoice prefix" htmlFor="invoicePrefix" error={errors?.invoicePrefix} required>
            <Input
              id="invoicePrefix"
              value={form.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value)}
              className="w-40"
              required
            />
          </FormField>
          <FormField label="GSTIN" htmlFor="gstin">
            <Input
              id="gstin"
              value={form.taxSettings?.gstin ?? ""}
              onChange={(e) => update("taxSettings", { gstin: e.target.value })}
              className="w-60"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Child pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label="Child rate applies up to age"
            htmlFor="childMaxAge"
            error={errors?.childMaxAge}
            hint="Guests aged 5 up to this age are charged each room type's child rate. Under 5 stays free. Above this age is charged the adult rate."
            required
          >
            <Input
              id="childMaxAge"
              type="number"
              min={0}
              value={form.childMaxAge}
              onChange={(e) => update("childMaxAge", Number(e.target.value))}
              className="w-28"
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
