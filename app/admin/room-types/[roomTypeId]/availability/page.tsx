import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { buildMonthGrid, formatISODate, getMonthBounds } from "@/lib/date-helpers";
import { resolveAvailableUnits } from "@/lib/pricing";
import { Availability } from "@/models/Availability";
import { RoomType } from "@/models/RoomType";
import { AvailabilityCalendar } from "../../_components/AvailabilityCalendar";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomTypeId: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await connectDB();
  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    notFound();
  }

  const now = new Date();
  const { year: yearParam, month: monthParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : now.getUTCFullYear();
  const month = monthParam ? Number(monthParam) : now.getUTCMonth() + 1;

  const { start, end } = getMonthBounds(year, month);
  const availabilityDocs = await Availability.find({
    roomTypeId,
    date: { $gte: start, $lt: end },
  });
  const availabilityByDate = new Map(availabilityDocs.map((doc) => [formatISODate(doc.date), doc]));

  const grid = buildMonthGrid(year, month);
  const weeks = grid.map((week) =>
    week.map((cell) => {
      const doc = availabilityByDate.get(cell.iso);
      const totalUnits = doc?.totalUnits ?? roomType.totalInventory;
      const booked = doc?.booked ?? 0;
      const blocked = doc?.blocked ?? 0;
      return {
        iso: cell.iso,
        day: cell.date.getUTCDate(),
        inMonth: cell.inMonth,
        isToday: cell.isToday,
        totalUnits,
        booked,
        blocked,
        availableUnits: resolveAvailableUnits(doc ?? undefined, roomType.totalInventory),
      };
    })
  );

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/admin/room-types/${roomTypeId}/edit`} className="text-sm text-muted-foreground hover:underline">
        &larr; Back to {roomType.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Availability — {roomType.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Click dates to select them, then block or unblock in bulk. Dates without a record default to the
        room type&apos;s total inventory ({roomType.totalInventory}).
      </p>
      <div className="mt-6">
        <AvailabilityCalendar
          roomTypeId={roomTypeId}
          year={year}
          month={month}
          weeks={weeks}
          prevHref={`/admin/room-types/${roomTypeId}/availability?year=${prevYear}&month=${prevMonth}`}
          nextHref={`/admin/room-types/${roomTypeId}/availability?year=${nextYear}&month=${nextMonth}`}
          monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
        />
      </div>
    </main>
  );
}
