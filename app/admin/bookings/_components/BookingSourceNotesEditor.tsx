"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABELS, type BookingSource } from "@/lib/constants/bookingSource";

export function BookingSourceNotesEditor({
  bookingId,
  source,
  internalNotes,
}: {
  bookingId: string;
  source: BookingSource;
  internalNotes?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sourceValue, setSourceValue] = useState<BookingSource>(source);
  const [notesValue, setNotesValue] = useState(internalNotes ?? "");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceValue, internalNotes: notesValue.trim() || undefined }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ title: typeof body?.error === "string" ? body.error : "Could not save changes", variant: "destructive" });
        return;
      }
      toast({ title: "Saved.", variant: "success" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium text-foreground">Internal details</p>
      <FormField label="Booking Source" htmlFor="source-edit">
        <Select value={sourceValue} onValueChange={(v) => setSourceValue(v as BookingSource)}>
          <SelectTrigger id="source-edit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOOKING_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Notes" htmlFor="notes-edit" hint="Internal only — not shown to the guest">
        <Textarea id="notes-edit" value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
      </FormField>
      <Button type="button" onClick={handleSave} disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
