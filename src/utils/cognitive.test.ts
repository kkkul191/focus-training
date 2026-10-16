import { describe, expect, it } from "vitest";
import { generateGoNoGoSequence, generateStroopSequence, isStroopResponseCorrect, scoreGoNoGo } from "@/src/utils/cognitive";

describe("cognitive training logic", () => {
  it("creates Stroop trials with valid words and ink colors", () => {
    const trials = generateStroopSequence(24, () => 0.4);
    expect(trials).toHaveLength(24);
    expect(trials.every((trial) => trial.word && trial.ink)).toBe(true);
    expect(isStroopResponseCorrect(trials[0], trials[0].ink)).toBe(true);
  });

  it("creates a Go/No-Go sequence with a 3:1 target ratio", () => {
    const trials = generateGoNoGoSequence(40, () => 0.5);
    expect(trials.filter((trial) => trial === "go")).toHaveLength(30);
    expect(trials.filter((trial) => trial === "no-go")).toHaveLength(10);
  });

  it("distinguishes commission and omission errors", () => {
    expect(scoreGoNoGo("no-go", true)).toEqual({ correct: false, commissionError: true, omissionError: false });
    expect(scoreGoNoGo("go", false)).toEqual({ correct: false, commissionError: false, omissionError: true });
  });
});
