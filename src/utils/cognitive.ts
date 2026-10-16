export const STROOP_COLORS = ["red", "blue", "green", "amber"] as const;
export type StroopColor = typeof STROOP_COLORS[number];
export type GoNoGoStimulus = "go" | "no-go";

export interface StroopStimulus {
  word: StroopColor;
  ink: StroopColor;
}

export function generateStroopSequence(count: number, random: () => number = Math.random): StroopStimulus[] {
  return Array.from({ length: count }, (_, index) => {
    const word = STROOP_COLORS[Math.floor(random() * STROOP_COLORS.length)];
    const shouldMatch = index % 3 === 0;
    if (shouldMatch) return { word, ink: word };
    const alternatives = STROOP_COLORS.filter((color) => color !== word);
    return { word, ink: alternatives[Math.floor(random() * alternatives.length)] };
  });
}

export function isStroopResponseCorrect(stimulus: StroopStimulus, response: StroopColor): boolean {
  return stimulus.ink === response;
}

export function generateGoNoGoSequence(count: number, random: () => number = Math.random): GoNoGoStimulus[] {
  const noGoCount = Math.max(1, Math.round(count * 0.25));
  const values: GoNoGoStimulus[] = [
    ...Array.from({ length: count - noGoCount }, () => "go" as const),
    ...Array.from({ length: noGoCount }, () => "no-go" as const),
  ];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}

export function scoreGoNoGo(stimulus: GoNoGoStimulus, responded: boolean) {
  return {
    correct: stimulus === "go" ? responded : !responded,
    commissionError: stimulus === "no-go" && responded,
    omissionError: stimulus === "go" && !responded,
  };
}

