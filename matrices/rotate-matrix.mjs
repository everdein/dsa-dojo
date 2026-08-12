export const maximumRotateMatrixSize = 8;

export function validateSquareMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0 || matrix.length > maximumRotateMatrixSize) {
    throw new Error(`Rotate Matrix requires a square matrix with 1-${maximumRotateMatrixSize} rows.`);
  }
  const size = matrix.length;
  for (let row = 0; row < size; row += 1) {
    if (
      !Object.hasOwn(matrix, row)
      || !Array.isArray(matrix[row])
      || matrix[row].length !== size
    ) {
      throw new Error("Rotate Matrix requires the same number of rows and columns.");
    }
    for (let column = 0; column < size; column += 1) {
      if (!Object.hasOwn(matrix[row], column) || !Number.isFinite(matrix[row][column])) {
        throw new Error("Rotate Matrix only accepts finite numbers in a dense square matrix.");
      }
    }
  }
  return matrix;
}

/** Return a clockwise 90-degree rotation without mutating the caller's matrix. */
export function rotateMatrix(matrix) {
  validateSquareMatrix(matrix);
  const rotated = matrix.map((row) => [...row]);

  for (let row = 0; row < rotated.length; row += 1) {
    for (let column = row + 1; column < rotated.length; column += 1) {
      [rotated[row][column], rotated[column][row]] = [
        rotated[column][row],
        rotated[row][column]
      ];
    }
  }

  for (const row of rotated) row.reverse();
  return rotated;
}
