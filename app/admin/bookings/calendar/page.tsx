import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  buildMonthGrid,
  buildWeekRow,
  formatISODate,
  getMonthBounds,
  getWeekBounds,
  getYearBounds,
} from "@/lib/date-helpers";
import { computeCalendarDayData } from "@/lib/booking-calendar";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/app/admin/_components/PageHeader";
import { BookingCalendar, type CalendarCellData } from "../_components/BookingCalendar";
import type { DayBookingSummaryClient } from "../_components/DayDetailModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ViewMode = "month" | "week" | "year";

function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminBookingsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    propertyId?: string;
    view?: string;
    year?: string;
    month?: string;
    date?: string;
    roomTypeId?: string;
  }>;
}) {
  const {
    propertyId: propertyIdParam,
    view: viewParam,
    year: yearParam,
    month: monthParam,
    date: dateParam,
    roomTypeId: roomTypeIdParam,
  } = await searchParams;

  await connectDB();
  const properties = await Property.find({ isActive: true }).select("name").sort({ name: 1 });

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Booking calendar" />
        <p className="mt-6 text-sm text-muted-foreground">No properties yet.</p>
      </div>
    );
  }

  const propertyId = properties.length === 1 ? properties[0]._id.toString() : propertyIdParam;
  const resolvedProperty = propertyId ? properties.find((p) => p._id.toString() === propertyId) : undefined;

  if (!resolvedProperty) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Booking calendar" description="Choose a property to view its booking calendar." />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {properties.map((p) => (
            <Link
              key={p._id.toString()}
              href={`/admin/bookings/calendar?propertyId=${p._id.toString()}`}
              className="rounded-md border border-border p-4 font-medium text-foreground hover:bg-muted"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const view: ViewMode = viewParam === "week" || viewParam === "year" ? viewParam : "month";

  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getUTCFullYear();
  const month = monthParam ? Number(monthParam) : now.getUTCMonth() + 1;
  const date = dateParam ?? formatISODate(now);

  const roomTypesForProperty = await RoomType.find({ propertyId: resolvedProperty._id }).select("name");
  const roomTypeId =
    roomTypeIdParam && roomTypesForProperty.some((rt) => rt._id.toString() === roomTypeIdParam)
      ? roomTypeIdParam
      : undefined;

  const baseParams = { propertyId: resolvedProperty._id.toString() };

  const viewTabs = (["month", "week", "year"] as ViewMode[]).map((v) => ({
    label: v[0].toUpperCase() + v.slice(1),
    href: `/admin/bookings/calendar${buildQuery({
      ...baseParams,
      roomTypeId,
      view: v,
      year: v !== "week" ? String(year) : undefined,
      month: v === "month" ? String(month) : undefined,
      date: v === "week" ? date : undefined,
    })}`,
    active: v === view,
  }));

  const roomTypeOptions = [
    {
      id: "",
      label: "All rooms",
      href: `/admin/bookings/calendar${buildQuery({ ...baseParams, view, year: String(year), month: String(month), date })}`,
      active: !roomTypeId,
    },
    ...roomTypesForProperty.map((rt) => ({
      id: rt._id.toString(),
      label: rt.name,
      href: `/admin/bookings/calendar${buildQuery({
        ...baseParams,
        roomTypeId: rt._id.toString(),
        view,
        year: String(year),
        month: String(month),
        date,
      })}`,
      active: roomTypeId === rt._id.toString(),
    })),
  ];

  const newBookingBaseHref = `/admin/bookings/new?propertyId=${resolvedProperty._id.toString()}`;

  let monthLabel: string | undefined;
  let weeks: CalendarCellData[][] | undefined;
  let weekRow: CalendarCellData[] | undefined;
  let yearMonths: { label: string; weeks: CalendarCellData[][]; href: string }[] | undefined;
  let prevHref: string | undefined;
  let nextHref: string | undefined;
  let dayBookingsRecord: Record<string, DayBookingSummaryClient[]> = {};

  if (view === "month") {
    const { start, end } = getMonthBounds(year, month);
    const { dayAggregateByIso, dayBookingsByIso } = await computeCalendarDayData({
      propertyId: resolvedProperty._id.toString(),
      roomTypeId,
      rangeStart: start,
      rangeEnd: end,
    });

    const grid = buildMonthGrid(year, month);
    weeks = grid.map((week) =>
      week.map((cell) => ({
        iso: cell.iso,
        day: cell.date.getUTCDate(),
        inMonth: cell.inMonth,
        isToday: cell.isToday,
        status: cell.inMonth ? dayAggregateByIso.get(cell.iso)?.status : undefined,
      }))
    );
    monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    prevHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, year: String(prevYear), month: String(prevMonth) })}`;
    nextHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, year: String(nextYear), month: String(nextMonth) })}`;

    dayBookingsRecord = Object.fromEntries(dayBookingsByIso);
  } else if (view === "week") {
    const { start, end } = getWeekBounds(date);
    const { dayAggregateByIso, dayBookingsByIso } = await computeCalendarDayData({
      propertyId: resolvedProperty._id.toString(),
      roomTypeId,
      rangeStart: start,
      rangeEnd: end,
    });

    const row = buildWeekRow(date);
    weekRow = row.map((cell) => ({
      iso: cell.iso,
      day: cell.date.getUTCDate(),
      inMonth: true,
      isToday: cell.isToday,
      status: dayAggregateByIso.get(cell.iso)?.status,
    }));
    monthLabel = `Week of ${formatISODate(start)}`;

    prevHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, date: formatISODate(new Date(start.getTime() - 86_400_000)) })}`;
    nextHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, date: formatISODate(end) })}`;

    dayBookingsRecord = Object.fromEntries(dayBookingsByIso);
  } else {
    const { start, end } = getYearBounds(year);
    const { dayAggregateByIso, dayBookingsByIso } = await computeCalendarDayData({
      propertyId: resolvedProperty._id.toString(),
      roomTypeId,
      rangeStart: start,
      rangeEnd: end,
    });

    yearMonths = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const grid = buildMonthGrid(year, m);
      return {
        label: MONTH_NAMES[i],
        weeks: grid.map((week) =>
          week.map((cell) => ({
            iso: cell.iso,
            day: cell.date.getUTCDate(),
            inMonth: cell.inMonth,
            isToday: cell.isToday,
            status: cell.inMonth ? dayAggregateByIso.get(cell.iso)?.status : undefined,
          }))
        ),
        href: `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view: "month", year: String(year), month: String(m) })}`,
      };
    });
    monthLabel = String(year);

    prevHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, year: String(year - 1) })}`;
    nextHref = `/admin/bookings/calendar${buildQuery({ ...baseParams, roomTypeId, view, year: String(year + 1) })}`;

    dayBookingsRecord = Object.fromEntries(dayBookingsByIso);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`Booking calendar — ${resolvedProperty.name}`}
        actions={
          properties.length > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/bookings/calendar">Switch property</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mt-8">
        <BookingCalendar
          monthLabel={monthLabel}
          weeks={weeks}
          weekRow={weekRow}
          yearMonths={yearMonths}
          prevHref={prevHref}
          nextHref={nextHref}
          dayBookings={dayBookingsRecord}
          viewTabs={viewTabs}
          roomTypeOptions={roomTypeOptions}
          newBookingBaseHref={newBookingBaseHref}
        />
      </div>
    </div>
  );
}
