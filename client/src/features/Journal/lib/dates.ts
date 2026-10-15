/** Local calendar date as YYYY-MM-DD (en-CA formats exactly that way). */
export const toDateKey = (d: Date): string => d.toLocaleDateString("en-CA");

export const todayKey = (): string => toDateKey(new Date());

/** Shift a YYYY-MM-DD key by whole days in local time. */
export const shiftDateKey = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};

/** e.g. "Thu, Oct 15, 2026" */
export const formatDateKey = (key: string): string => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
