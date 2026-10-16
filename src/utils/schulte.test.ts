import { describe, expect, it } from "vitest";
import { createSchulteGrid, isExpectedSchulteClick } from "@/src/utils/schulte";

describe("Schulte logic", () => {
  it("creates a complete randomized permutation", () => {
    const grid = createSchulteGrid(() => 0.37);
    expect(grid).toHaveLength(25);
    expect([...grid].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(grid).not.toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
  });
  it("accepts only the next number", () => { expect(isExpectedSchulteClick(7, 7)).toBe(true); expect(isExpectedSchulteClick(7, 8)).toBe(false); });
});

