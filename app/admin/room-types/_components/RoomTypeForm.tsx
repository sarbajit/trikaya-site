"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImageGalleryUploader, type GalleryImage } from "@/components/ImageGalleryUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface RoomTypeFormData {
  name: string;
  maxOccupancy: string;
  pricingModel: "per_night" | "per_person_per_night";
  basePriceB2C: string;
  basePriceB2B: string;
  images: GalleryImage[];
  totalInventory: string;
}

export const EMPTY_ROOM_TYPE_FORM: RoomTypeFormData = {
  name: "",
  maxOccupancy: "2",
  pricingModel: "per_night",
  basePriceB2C: "",
  basePriceB2B: "",
  images: [],
  totalInventory: "1",
};

interface RoomTypeFormProps {
  propertyId: string;
  initialData?: RoomTypeFormData;
  roomTypeId?: string;
}

export function RoomTypeForm({ propertyId, initialData, roomTypeId }: RoomTypeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(roomTypeId);
  const [form, setForm] = useState<RoomTypeFormData>(initialData ?? EMPTY_ROOM_TYPE_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof RoomTypeFormData>(key: K, value: RoomTypeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrors(null);
    setFormError(null);

    const body = {
      propertyId,
      name: form.name,
      maxOccupancy: Number(form.maxOccupancy),
      pricingModel: form.pricingModel,
      basePriceB2C: Number(form.basePriceB2C),
      basePriceB2B: Number(form.basePriceB2B),
      images: form.images,
      totalInventory: Number(form.totalInventory),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/room-types/${roomTypeId}` : `/api/admin/properties/${propertyId}/room-types`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        setErrors(responseBody?.error?.fieldErrors ?? null);
        setFormError(responseBody?.error?.formErrors?.[0] ?? "Failed to save room type");
        return;
      }

      if (!isEdit) {
        router.push(`/admin/properties/${propertyId}/edit`);
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
          <CardTitle>Room type details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxOccupancy">Max occupancy</Label>
              <Input
                id="maxOccupancy"
                type="number"
                min={1}
                value={form.maxOccupancy}
                onChange={(e) => update("maxOccupancy", e.target.value)}
                className="w-28"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalInventory">Total inventory</Label>
              <Input
                id="totalInventory"
                type="number"
                min={0}
                value={form.totalInventory}
                onChange={(e) => update("totalInventory", e.target.value)}
                className="w-28"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pricingModel">Pricing model</Label>
            <Select
              value={form.pricingModel}
              onValueChange={(v) => update("pricingModel", v as RoomTypeFormData["pricingModel"])}
            >
              <SelectTrigger id="pricingModel" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_night">Per night (flat)</SelectItem>
                <SelectItem value="per_person_per_night">Per person, per night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="basePriceB2C">Base rate (B2C, ₹)</Label>
              <Input
                id="basePriceB2C"
                type="number"
                min={0}
                value={form.basePriceB2C}
                onChange={(e) => update("basePriceB2C", e.target.value)}
                className="w-32"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="basePriceB2B">Base rate (B2B, ₹)</Label>
              <Input
                id="basePriceB2B"
                type="number"
                min={0}
                value={form.basePriceB2B}
                onChange={(e) => update("basePriceB2B", e.target.value)}
                className="w-32"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGalleryUploader folder="rooms" images={form.images} onChange={(images) => update("images", images)} />
        </CardContent>
      </Card>

      {(errors || formError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {formError && <div>{formError}</div>}
            {errors &&
              Object.entries(errors).map(([field, messages]) => (
                <div key={field}>
                  <strong>{field}:</strong> {messages.join(", ")}
                </div>
              ))}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create room type"}
      </Button>
    </form>
  );
}
