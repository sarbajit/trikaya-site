"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  totalUnits: number;
  booked: number;
  blocked: number;
  availableUnits: number;
}

interface AvailabilityCalendarProps {
  roomTypeId: string;
  year: number;
  month: number;
  weeks: CalendarCell[][];
  prevHref: string;
  nextHref: string;
  monthLabel: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityCalendar({ roomTypeId, weeks, prevHref, nextHref, monthLabel }: AvailabilityCalendarProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDate(iso: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) {
        next.delete(iso);
      } else {
        next.add(iso);
      }
      return next;
    });
  }

  async function applyAction(action: "block" | "unblock") {
    if (selected.size === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/room-types/${roomTypeId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dates: Array.from(selected) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error?.formErrors?.[0] ?? "Failed to update availability");
        return;
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={prevHref}>&larr; Prev</Link>
        </Button>
        <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
        <Button asChild variant="outline" size="sm">
          <Link href={nextHref}>Next &rarr;</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell) => {
          const isSelected = selected.has(cell.iso);
          const isSoldOut = cell.availableUnits < 1;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!cell.inMonth}
              onClick={() => toggleDate(cell.iso)}
              className={cn(
                "flex min-h-16 flex-col items-start gap-0.5 rounded-md border p-1.5 text-left text-xs transition-colors",
                cell.inMonth ? "border-input" : "border-transparent opacity-30",
                cell.inMonth && !isSelected && "hover:bg-muted",
                isSelected && "border-primary bg-primary/10",
                cell.isToday && "ring-1 ring-ring"
              )}
            >
              <span className="font-medium text-foreground">{cell.day}</span>
              {cell.inMonth && (
                <span className={cn("text-[11px]", isSoldOut ? "text-destructive" : "text-muted-foreground")}>
                  {isSoldOut ? "Blocked/sold out" : `${cell.availableUnits}/${cell.totalUnits} open`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} date(s) selected</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={selected.size === 0 || isSubmitting}
          onClick={() => applyAction("block")}
        >
          Block selected
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={selected.size === 0 || isSubmitting}
          onClick={() => applyAction("unblock")}
        >
          Unblock selected
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={selected.size === 0} onClick={() => setSelected(new Set())}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
