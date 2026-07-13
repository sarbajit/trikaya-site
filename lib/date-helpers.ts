/**
 * Date-only helpers for the properties/rates/availability domain.
 *
 * Convention: every Date value in this domain (checkIn/checkOut, RatePlan
 * startDate/endDate, Availability.date) is normalized to UTC midnight and
 * carries no time-of-day meaning. The server runs in UTC (Vercel); mixing
 * local-time Date getters with these values would introduce off-by-one bugs
 * for IST (UTC+5:30) callers. Always go through these helpers rather than
 * `new Date(str)` + `.getDate()`/`.getDay()` directly.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toDateOnlyUTC(input: Date | string): Date {
  if (typeof input === "string") {
    const parsed = parseISODate(input);
    if (!parsed) {
      throw new RangeError(`Invalid date string: ${input}`);
    }
    return parsed;
  }
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function formatISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidISODateString(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && formatISODate(d) === s;
}

export function parseISODate(s: string): Date | null {
  if (!isValidISODateString(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDays(d: Date, n: number): Date {
  const result = new Date(d.getTime());
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

export function diffNights(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

/**
 * Enumerates one Date per stayed night over the half-open range
 * [checkIn, checkOut). Accepts Date or ISO date-only strings.
 */
export function enumerateNights(checkIn: Date | string, checkOut: Date | string): Date[] {
  const start = toDateOnlyUTC(checkIn);
  const end = toDateOnlyUTC(checkOut);
  if (end.getTime() <= start.getTime()) {
    throw new RangeError("checkOut must be after checkIn");
  }
  const nights: Date[] = [];
  for (let d = start; d.getTime() < end.getTime(); d = addDays(d, 1)) {
    nights.push(d);
  }
  return nights;
}

/** 0 = Sunday .. 6 = Saturday, matching RatePlan.daysOfWeek. */
export function getUTCDayOfWeek(d: Date): number {
  return d.getUTCDay();
}

export function getMonthBounds(year: number, month1to12: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1));
  const end = new Date(Date.UTC(year, month1to12, 1));
  return { start, end };
}

export interface MonthGridCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

/**
 * Builds a 6x7 grid of calendar cells for the given month, including
 * leading/trailing days from adjacent months (inMonth: false) so every row
 * is a full week. weekStartsOn: 0 = Sunday (default), 1 = Monday.
 */
export function buildMonthGrid(
  year: number,
  month1to12: number,
  weekStartsOn: 0 | 1 = 0
): MonthGridCell[][] {
  const { start } = getMonthBounds(year, month1to12);
  const startWeekday = start.getUTCDay();
  const leadingDays = (startWeekday - weekStartsOn + 7) % 7;
  const gridStart = addDays(start, -leadingDays);

  const todayISO = formatISODate(toDateOnlyUTC(new Date()));
  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const iso = formatISODate(date);
    cells.push({
      date,
      iso,
      inMonth: date.getUTCMonth() === month1to12 - 1 && date.getUTCFullYear() === year,
      isToday: iso === todayISO,
    });
  }

  const weeks: MonthGridCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** The 7-day range [start, end) containing dateIso, starting on weekStartsOn. */
export function getWeekBounds(dateIso: string, weekStartsOn: 0 | 1 = 0): { start: Date; end: Date } {
  const date = toDateOnlyUTC(dateIso);
  const dow = date.getUTCDay();
  const diff = (dow - weekStartsOn + 7) % 7;
  const start = addDays(date, -diff);
  const end = addDays(start, 7);
  return { start, end };
}

/** A single row of 7 calendar cells for the week containing dateIso. */
export function buildWeekRow(dateIso: string, weekStartsOn: 0 | 1 = 0): MonthGridCell[] {
  const { start } = getWeekBounds(dateIso, weekStartsOn);
  const todayISO = formatISODate(toDateOnlyUTC(new Date()));
  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const iso = formatISODate(date);
    cells.push({ date, iso, inMonth: true, isToday: iso === todayISO });
  }
  return cells;
}

export function getYearBounds(year: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}
