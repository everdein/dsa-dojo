const steps = 6;

(async () => {
  const { climbStairs } = await import("./climbing-stairs.mjs");
  console.log(`${steps} steps:`, climbStairs(steps));
})();
