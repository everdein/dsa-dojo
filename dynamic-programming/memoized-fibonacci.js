// Runnable entry point for the shared Memoized Fibonacci implementation.

const value = 6;

(async () => {
  const { memoizedFibonacci } = await import("./memoized-fibonacci.mjs");
  console.log(memoizedFibonacci(value));
})();

// Time complexity: O(n)
// Space complexity: O(n)
