import { maximumRecursiveFibonacciInput } from "../recursion/fibonacci.mjs";

export const maximumMemoizedFibonacciInput = maximumRecursiveFibonacciInput;

export function validateMemoizedFibonacciInput(value) {
  if (
    !Number.isSafeInteger(value)
    || value < 0
    || value > maximumMemoizedFibonacciInput
  ) {
    throw new Error(
      `Memoized Fibonacci requires a whole number from 0 to ${maximumMemoizedFibonacciInput}.`
    );
  }
  return value;
}

export function parseMemoizedFibonacciInput(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error(
      `Enter a whole number from 0 to ${maximumMemoizedFibonacciInput}.`
    );
  }
  return validateMemoizedFibonacciInput(Number(source.trim()));
}

export function formatMemoizedFibonacciInput(value) {
  return String(validateMemoizedFibonacciInput(value));
}

/**
 * Compute Fibonacci with a private memo table. Base cases are cached as well,
 * so every distinct subproblem is evaluated at most once during this call.
 */
export function memoizedFibonacci(value) {
  validateMemoizedFibonacciInput(value);
  const memo = new Map();

  function visit(current) {
    if (memo.has(current)) return memo.get(current);

    if (current <= 1) {
      memo.set(current, current);
      return current;
    }

    const result = visit(current - 1) + visit(current - 2);
    memo.set(current, result);
    return result;
  }

  return visit(value);
}

export const fibonacciMemoized = memoizedFibonacci;
