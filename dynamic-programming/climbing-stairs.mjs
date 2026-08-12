export const maximumClimbingStairsInput = 30;

export function validateClimbingStairsInput(steps) {
  if (!Number.isSafeInteger(steps) || steps < 0 || steps > maximumClimbingStairsInput) {
    throw new Error(`Climbing Stairs requires a whole number from 0 to ${maximumClimbingStairsInput}.`);
  }
  return steps;
}

export function parseClimbingStairsInput(raw) {
  if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "") {
    throw new Error(`Enter a whole number from 0 to ${maximumClimbingStairsInput}.`);
  }
  return validateClimbingStairsInput(Number(raw));
}

export function climbStairs(steps) {
  validateClimbingStairsInput(steps);
  if (steps <= 1) return 1;
  let twoBack = 1;
  let oneBack = 1;
  for (let current = 2; current <= steps; current += 1) {
    [twoBack, oneBack] = [oneBack, twoBack + oneBack];
  }
  return oneBack;
}

export function climbingStairsTable(steps) {
  validateClimbingStairsInput(steps);
  const table = Array(steps + 1).fill(0);
  table[0] = 1;
  if (steps >= 1) table[1] = 1;
  for (let current = 2; current <= steps; current += 1) {
    table[current] = table[current - 1] + table[current - 2];
  }
  return table;
}
