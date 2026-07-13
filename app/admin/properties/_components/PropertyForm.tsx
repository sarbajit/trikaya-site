"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DynamicListField } from "@/app/admin/_components/DynamicListField";
import { ImageGalleryUploader, type GalleryImage } from "@/components/ImageGalleryUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface PropertyFormData {
  name: string;
  slug: string;
  destination: string;
  address: string;
  geoLat: string;
  geoLng: string;
  description: string;
  propertyType: "hotel" | "resort" | "homestay";
  amenities: string[];
  images: GalleryImage[];
  starRating: string;
  checkIn: string;
  checkOut: string;
  houseRules: string;
  cancellationPolicy: string;
  isActive: boolean;
  homepageMode: "auto" | "single" | "portfolio" | "portal";
}

interface PropertyFormProps {
  initialData?: PropertyFormData;
  propertyId?: string;
}

export const EMPTY_PROPERTY_FORM: PropertyFormData = {
  name: "",
  slug: "",
  destination: "",
  address: "",
  geoLat: "",
  geoLng: "",
  description: "",
  propertyType: "hotel",
  amenities: [],
  images: [],
  starRating: "",
  checkIn: "",
  checkOut: "",
  houseRules: "",
  cancellationPolicy: "",
  isActive: true,
  homepageMode: "auto",
};

export function PropertyForm({ initialData, propertyId }: PropertyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(propertyId);
  const [form, setForm] = useState<PropertyFormData>(initialData ?? EMPTY_PROPERTY_FORM);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function update<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    update("name", value);
    if (!slugTouched) {
      update("slug", slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrors(null);

    const body = {
      name: form.name,
      slug: form.slug,
      destination: form.destination,
      address: form.address,
      geo:
        form.geoLat.trim() && form.geoLng.trim()
          ? { lat: Number(form.geoLat), lng: Number(form.geoLng) }
          : undefined,
      description: form.description,
      propertyType: form.propertyType,
      amenities: form.amenities.filter((item) => item.trim().length > 0),
      images: form.images,
      starRating: form.starRating.trim() ? Number(form.starRating) : undefined,
      policies: {
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        houseRules: form.houseRules || undefined,
        cancellationPolicy: form.cancellationPolicy || undefined,
      },
      isActive: form.isActive,
      homepageMode: form.homepageMode,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/properties/${propertyId}` : "/api/admin/properties",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        setErrors(responseBody?.error?.fieldErrors ?? null);
        toast({
          title: responseBody?.error?.formErrors?.[0] ?? "Failed to save property",
          variant: "destructive",
        });
        return;
      }

      const saved = await response.json();
      toast({ title: isEdit ? "Changes saved." : "Property created.", variant: "success" });
      if (!isEdit) {
        router.push(`/admin/properties/${saved._id}/edit`);
      } else {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Name" htmlFor="name" error={errors?.name} required>
            <Input id="name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
          </FormField>
          <FormField label="Slug" htmlFor="slug" error={errors?.slug} required>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
              required
            />
          </FormField>
          <FormField label="Property type" htmlFor="propertyType" error={errors?.propertyType}>
            <Select value={form.propertyType} onValueChange={(v) => update("propertyType", v as PropertyFormData["propertyType"])}>
              <SelectTrigger id="propertyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
                <SelectItem value="homestay">Homestay</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Star rating (1-5)" htmlFor="starRating" error={errors?.starRating}>
            <Input
              id="starRating"
              type="number"
              min={1}
              max={5}
              value={form.starRating}
              onChange={(e) => update("starRating", e.target.value)}
              className="w-24"
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} />
            <Label htmlFor="isActive">Active (visible on the public site)</Label>
          </div>
          <FormField label="Homepage mode" htmlFor="homepageMode" error={errors?.homepageMode}>
            <Select value={form.homepageMode} onValueChange={(v) => update("homepageMode", v as PropertyFormData["homepageMode"])}>
              <SelectTrigger id="homepageMode" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Destination" htmlFor="destination" error={errors?.destination} required>
            <Input id="destination" value={form.destination} onChange={(e) => update("destination", e.target.value)} required />
          </FormField>
          <FormField label="Address" htmlFor="address" error={errors?.address} required>
            <Textarea id="address" value={form.address} onChange={(e) => update("address", e.target.value)} required />
          </FormField>
          <div className="flex gap-4">
            <FormField label="Latitude" htmlFor="geoLat" error={errors?.geo}>
              <Input id="geoLat" value={form.geoLat} onChange={(e) => update("geoLat", e.target.value)} className="w-32" />
            </FormField>
            <FormField label="Longitude" htmlFor="geoLng">
              <Input id="geoLng" value={form.geoLng} onChange={(e) => update("geoLng", e.target.value)} className="w-32" />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description &amp; amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Description" htmlFor="description" error={errors?.description} required>
            <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} required />
          </FormField>
          <DynamicListField label="Amenities" items={form.amenities} onChange={(items) => update("amenities", items)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGalleryUploader
            folder="properties"
            images={form.images}
            onChange={(images) => update("images", images)}
            altHint={form.name || "Property"}
          />
          {errors?.images && errors.images.length > 0 && (
            <p className="mt-2 text-xs text-destructive">{errors.images.join(", ")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <FormField label="Check-in" htmlFor="checkIn">
              <Input id="checkIn" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} placeholder="e.g. 2:00 PM" className="w-40" />
            </FormField>
            <FormField label="Check-out" htmlFor="checkOut">
              <Input id="checkOut" value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} placeholder="e.g. 11:00 AM" className="w-40" />
            </FormField>
          </div>
          <FormField label="House rules" htmlFor="houseRules">
            <Textarea id="houseRules" value={form.houseRules} onChange={(e) => update("houseRules", e.target.value)} />
          </FormField>
          <FormField label="Cancellation policy" htmlFor="cancellationPolicy">
            <Textarea id="cancellationPolicy" value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create property"}
      </Button>
    </form>
  );
}
