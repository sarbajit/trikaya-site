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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettingsData {
  companyName: string;
  showCompanyName: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  socialLinks: SocialLink[];
  contactRecipientEmail: string;
  b2bEnabled: boolean;
  invoicePrefix: string;
  taxSettings?: { gstin?: string };
}

const DEFAULT_COLORS: Record<"primaryColor" | "secondaryColor" | "accentColor", string> = {
  primaryColor: "#1e3a8a",
  secondaryColor: "#f59e0b",
  accentColor: "#10b981",
};

export function SiteSettingsForm({ initialSettings }: { initialSettings: SiteSettingsData }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettingsData>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? { form: ["Failed to save settings"] });
        return;
      }

      setSuccessMessage("Settings saved.");
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              required
            />
          </div>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactRecipientEmail">Contact form recipient email</Label>
            <Input
              id="contactRecipientEmail"
              type="email"
              value={form.contactRecipientEmail}
              onChange={(e) => update("contactRecipientEmail", e.target.value)}
              required
            />
          </div>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invoicePrefix">Invoice prefix</Label>
            <Input
              id="invoicePrefix"
              value={form.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value)}
              className="w-40"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              value={form.taxSettings?.gstin ?? ""}
              onChange={(e) => update("taxSettings", { gstin: e.target.value })}
              className="w-60"
            />
          </div>
        </CardContent>
      </Card>

      {errors && (
        <Alert variant="destructive">
          <AlertDescription>
            {Object.entries(errors).map(([field, messages]) => (
              <div key={field}>
                <strong>{field}:</strong> {messages.join(", ")}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
