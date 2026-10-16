"use client";

import { useEffect, useState } from "react";
import { getElapsedSeconds, getRemainingSeconds } from "@/src/utils/time";

export function useTimestampTimer(startTimestamp: number | null, durationMinutes?: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startTimestamp === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startTimestamp]);

  const elapsed = startTimestamp === null ? 0 : getElapsedSeconds(startTimestamp, now);
  const remaining = startTimestamp === null || durationMinutes === undefined
    ? 0
    : getRemainingSeconds(startTimestamp, durationMinutes, now);
  return { elapsed, remaining, now };
}

