"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface RatePlanFormData {
  label: string;
  startDate: string;
  endDate: string;
  b2cRate: string;
  b2bRate: string;
  daysOfWeek: number[];
}

export const EMPTY_RATE_PLAN_FORM: RatePlanFormData = {
  label: "",
  startDate: "",
  endDate: "",
  b2cRate: "",
  b2bRate: "",
  daysOfWeek: [],
};

interface RatePlanFormProps {
  roomTypeId: string;
  initialData?: RatePlanFormData;
  ratePlanId?: string;
}

export function RatePlanForm({ roomTypeId, initialData, ratePlanId }: RatePlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(ratePlanId);
  const [form, setForm] = useState<RatePlanFormData>(initialData ?? EMPTY_RATE_PLAN_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function update<K extends keyof RatePlanFormData>(key: K, value: RatePlanFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: number) {
    update(
      "daysOfWeek",
      form.daysOfWeek.includes(day) ? form.daysOfWeek.filter((d) => d !== day) : [...form.daysOfWeek, day].sort()
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrors(null);

    const body = {
      roomTypeId,
      label: form.label || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      b2cRate: Number(form.b2cRate),
      b2bRate: Number(form.b2bRate),
      daysOfWeek: form.daysOfWeek.length > 0 ? form.daysOfWeek : undefined,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/rate-plans/${ratePlanId}` : `/api/admin/room-types/${roomTypeId}/rate-plans`,
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
          title: responseBody?.error?.formErrors?.[0] ?? "Failed to save rate plan",
          variant: "destructive",
        });
        return;
      }

      toast({ title: isEdit ? "Changes saved." : "Rate plan created.", variant: "success" });
      if (!isEdit) {
        router.push(`/admin/room-types/${roomTypeId}/rate-plans`);
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
          <CardTitle>Rate plan</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Label (optional)" htmlFor="label" error={errors?.label}>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="e.g. Winter Season"
            />
          </FormField>
          <div className="flex gap-4">
            <FormField label="Start date" htmlFor="startDate" error={errors?.startDate} required>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                required
              />
            </FormField>
            <FormField label="End date (exclusive)" htmlFor="endDate" error={errors?.endDate} required>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="flex gap-4">
            <FormField label="B2C rate (₹)" htmlFor="b2cRate" error={errors?.b2cRate} required>
              <Input
                id="b2cRate"
                type="number"
                min={0}
                value={form.b2cRate}
                onChange={(e) => update("b2cRate", e.target.value)}
                className="w-32"
                required
              />
            </FormField>
            <FormField label="B2B rate (₹)" htmlFor="b2bRate" error={errors?.b2bRate} required>
              <Input
                id="b2bRate"
                type="number"
                min={0}
                value={form.b2bRate}
                onChange={(e) => update("b2bRate", e.target.value)}
                className="w-32"
                required
              />
            </FormField>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Days of week (leave empty to apply every day)</Label>
            <div className="flex flex-wrap gap-3">
              {DAY_LABELS.map((dayLabel, day) => (
                <label key={day} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={form.daysOfWeek.includes(day)} onCheckedChange={() => toggleDay(day)} />
                  {dayLabel}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create rate plan"}
      </Button>
    </form>
  );
}
