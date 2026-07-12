export function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function parseDateStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000`);
}

export function parseDateEnd(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999`);
}

export function isInDateRange(
  value: string | Date,
  from: string,
  to: string
) {
  if (!from && !to) return true;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  if (from && date < parseDateStart(from)) return false;
  if (to && date > parseDateEnd(to)) return false;
  return true;
}

export function matchesSearch(values: Array<string | null | undefined>, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => v?.toLowerCase().includes(q));
}

export const defaultMonthRange = () => ({
  from: toDateInputValue(startOfMonth()),
  to: toDateInputValue(new Date()),
});
