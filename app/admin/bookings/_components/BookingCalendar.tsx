"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DayDetailModal, type DayBookingSummaryClient } from "./DayDetailModal";

export interface CalendarCellData {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  status?: "available" | "partial" | "full";
}

interface ViewTab {
  label: string;
  href: string;
  active: boolean;
}

interface RoomTypeOption {
  id: string;
  label: string;
  href: string;
  active: boolean;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CLASSES: Record<NonNullable<CalendarCellData["status"]>, string> = {
  available: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800",
  partial: "bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800",
  full: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20",
};

function DayCell({
  cell,
  onSelect,
}: {
  cell: CalendarCellData;
  onSelect: (iso: string) => void;
}) {
  return (
    <button
      key={cell.iso}
      type="button"
      disabled={!cell.inMonth}
      onClick={() => onSelect(cell.iso)}
      className={cn(
        "flex min-h-14 flex-col items-start gap-0.5 rounded-md border p-1.5 text-left text-xs transition-colors",
        !cell.inMonth && "border-transparent opacity-30",
        cell.inMonth && !cell.status && "border-input hover:bg-muted",
        cell.inMonth && cell.status && STATUS_CLASSES[cell.status],
        cell.isToday && "ring-1 ring-ring"
      )}
    >
      <span className="font-medium text-foreground">{cell.day}</span>
    </button>
  );
}

export function BookingCalendar({
  monthLabel,
  weeks,
  weekRow,
  yearMonths,
  prevHref,
  nextHref,
  dayBookings,
  viewTabs,
  roomTypeOptions,
  newBookingBaseHref,
}: {
  monthLabel?: string;
  weeks?: CalendarCellData[][];
  weekRow?: CalendarCellData[];
  yearMonths?: { label: string; weeks: CalendarCellData[][]; href: string }[];
  prevHref?: string;
  nextHref?: string;
  dayBookings: Record<string, DayBookingSummaryClient[]>;
  viewTabs: ViewTab[];
  roomTypeOptions: RoomTypeOption[];
  newBookingBaseHref: string;
}) {
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const allCells = weeks ? weeks.flat() : weekRow ? weekRow : [];
  const selectedCell = allCells.find((c) => c.iso === selectedIso);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-border p-1">
          {viewTabs.map((tab) => (
            <Button key={tab.label} asChild variant={tab.active ? "default" : "ghost"} size="sm">
              <Link href={tab.href}>{tab.label}</Link>
            </Button>
          ))}
        </div>

        {roomTypeOptions.length > 1 && (
          <div className="flex flex-wrap gap-1 rounded-md border border-border p-1">
            {roomTypeOptions.map((rt) => (
              <Button key={rt.id} asChild variant={rt.active ? "default" : "ghost"} size="sm">
                <Link href={rt.href}>{rt.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-400" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-400" /> Partially booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive" /> Fully booked
        </span>
      </div>

      {(prevHref || nextHref || monthLabel) && (
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm" className={cn(!prevHref && "invisible")}>
            <Link href={prevHref ?? "#"}>&larr; Prev</Link>
          </Button>
          <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
          <Button asChild variant="outline" size="sm" className={cn(!nextHref && "invisible")}>
            <Link href={nextHref ?? "#"}>Next &rarr;</Link>
          </Button>
        </div>
      )}

      {(weeks || weekRow) && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {(weeks ? weeks.flat() : weekRow!).map((cell) => (
              <DayCell key={cell.iso} cell={cell} onSelect={setSelectedIso} />
            ))}
          </div>
        </>
      )}

      {yearMonths && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yearMonths.map((month) => (
            <div key={month.label} className="flex flex-col gap-1.5">
              <Link href={month.href} className="text-sm font-semibold text-foreground hover:underline">
                {month.label}
              </Link>
              <div className="grid grid-cols-7 gap-0.5">
                {month.weeks.flat().map((cell) => (
                  <div
                    key={cell.iso}
                    className={cn(
                      "aspect-square rounded-sm",
                      !cell.inMonth && "opacity-0",
                      cell.inMonth && !cell.status && "bg-muted",
                      cell.inMonth && cell.status && STATUS_CLASSES[cell.status]
                    )}
                    title={cell.inMonth ? cell.iso : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DayDetailModal
        open={selectedIso !== null}
        onOpenChange={(open) => !open && setSelectedIso(null)}
        iso={selectedIso}
        status={selectedCell?.status}
        bookings={selectedIso ? dayBookings[selectedIso] ?? [] : []}
        newBookingHref={selectedIso ? `${newBookingBaseHref}&date=${selectedIso}` : newBookingBaseHref}
      />
    </div>
  );
}
