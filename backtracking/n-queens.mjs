export const maximumNQueensSize = 5;

export function validateNQueensSize(size) {
  if (!Number.isSafeInteger(size) || size < 1 || size > maximumNQueensSize) {
    throw new Error(`N-Queens requires a board size from 1 to ${maximumNQueensSize}.`);
  }
  return size;
}

export function solveNQueens(size) {
  validateNQueensSize(size);
  const solutions = [];
  const placement = [];
  const columns = new Set();
  const falling = new Set();
  const rising = new Set();

  const search = (row) => {
    if (row === size) {
      solutions.push([...placement]);
      return;
    }
    for (let column = 0; column < size; column += 1) {
      const fallingKey = row - column;
      const risingKey = row + column;
      if (columns.has(column) || falling.has(fallingKey) || rising.has(risingKey)) continue;
      placement.push(column);
      columns.add(column);
      falling.add(fallingKey);
      rising.add(risingKey);
      search(row + 1);
      placement.pop();
      columns.delete(column);
      falling.delete(fallingKey);
      rising.delete(risingKey);
    }
  };
  search(0);
  return solutions;
}

export function isValidQueenPlacement(placement) {
  if (!Array.isArray(placement)) return false;
  const columns = new Set();
  const falling = new Set();
  const rising = new Set();
  for (let row = 0; row < placement.length; row += 1) {
    const column = placement[row];
    if (!Number.isSafeInteger(column) || column < 0 || column >= placement.length) return false;
    if (columns.has(column) || falling.has(row - column) || rising.has(row + column)) return false;
    columns.add(column);
    falling.add(row - column);
    rising.add(row + column);
  }
  return true;
}
