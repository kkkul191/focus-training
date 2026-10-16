export function createSchulteGrid(random: () => number = Math.random): number[] {
  const values = Array.from({ length: 25 }, (_, index) => index + 1);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}

export function isExpectedSchulteClick(expected: number, clicked: number): boolean {
  return clicked === expected;
}

