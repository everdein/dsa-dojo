const value = 6;

(async () => {
  const { recursiveFibonacci } = await import("./fibonacci.mjs");
  console.log(`fib(${value}) =`, recursiveFibonacci(value));
})();
