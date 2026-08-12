const size = 4;

(async () => {
  const { solveNQueens } = await import("./n-queens.mjs");
  console.log(solveNQueens(size));
})();
