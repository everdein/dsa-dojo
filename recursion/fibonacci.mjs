export const maximumRecursiveFibonacciInput = 6;

export function validateRecursiveFibonacciInput(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximumRecursiveFibonacciInput) {
    throw new Error(`Recursive Fibonacci requires a whole number from 0 to ${maximumRecursiveFibonacciInput}.`);
  }
  return value;
}

export function parseRecursiveFibonacciInput(raw) {
  if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "") {
    throw new Error(`Enter a whole number from 0 to ${maximumRecursiveFibonacciInput}.`);
  }
  return validateRecursiveFibonacciInput(Number(raw));
}

export function recursiveFibonacci(value) {
  validateRecursiveFibonacciInput(value);
  if (value <= 1) return value;
  return recursiveFibonacci(value - 1) + recursiveFibonacci(value - 2);
}

export function countRecursiveFibonacciCalls(value) {
  validateRecursiveFibonacciInput(value);
  if (value <= 1) return 1;
  return 1 + countRecursiveFibonacciCalls(value - 1) + countRecursiveFibonacciCalls(value - 2);
}
