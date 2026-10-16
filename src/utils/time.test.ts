import { describe, expect, it } from "vitest";
import { getElapsedSeconds, getRemainingSeconds } from "@/src/utils/time";

describe("timestamp timer", () => {
  it("calculates from timestamps instead of interval ticks", () => {
    expect(getElapsedSeconds(1_000, 66_500)).toBe(65);
    expect(getRemainingSeconds(1_000, 2, 66_500)).toBe(55);
  });
  it("never returns negative remaining time", () => {
    expect(getRemainingSeconds(0, 1, 120_000)).toBe(0);
  });
});

