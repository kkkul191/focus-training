export function getElapsedSeconds(startTimestamp: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - startTimestamp) / 1000));
}

export function getRemainingSeconds(
  startTimestamp: number,
  durationMinutes: number,
  now = Date.now(),
): number {
  return Math.max(0, durationMinutes * 60 - getElapsedSeconds(startTimestamp, now));
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function toLocalDateKey(value: string | number | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function formatMinutes(value: number): string {
  if (value < 1 && value > 0) return "< 1 min";
  return `${Math.round(value)} min`;
}

