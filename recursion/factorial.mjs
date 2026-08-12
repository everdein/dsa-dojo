export const maximumFactorialInput = 12;

export function validateFactorialInput(value) {
  if (!Number.isInteger(value) || value < 0 || value > maximumFactorialInput) {
    throw new Error(
      `Factorial input must be a whole number from 0 through ${maximumFactorialInput}.`
    );
  }
  return value;
}

export function parseFactorialInput(raw) {
  if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "") {
    throw new Error("Enter a factorial input.");
  }
  const value = Number(raw);
  validateFactorialInput(value);
  return value;
}

export function formatFactorialInput(value) {
  validateFactorialInput(value);
  return String(value);
}

/**
 * Computes n! recursively. The bounded input keeps every multiplication exact
 * as a JavaScript safe integer and keeps the call stack small enough to study.
 */
export function factorial(value) {
  validateFactorialInput(value);
  if (value <= 1) return 1;
  const smallerFactorial = factorial(value - 1);
  return value * smallerFactorial;
}
