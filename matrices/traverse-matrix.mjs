export const maximumMatrixRows = 8;
export const maximumMatrixColumns = 8;

export function validateMatrixInput(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error("Matrix Traversal requires at least one row.");
  }
  if (matrix.length > maximumMatrixRows) {
    throw new Error(`Matrix Traversal accepts ${maximumMatrixRows} rows or fewer.`);
  }

  let columnCount = null;
  for (let row = 0; row < matrix.length; row += 1) {
    if (!Object.hasOwn(matrix, row) || !Array.isArray(matrix[row])) {
      throw new Error("Matrix Traversal requires a rectangular array of rows.");
    }

    const values = matrix[row];
    if (values.length === 0) {
      throw new Error("Every matrix row requires at least one value.");
    }
    if (values.length > maximumMatrixColumns) {
      throw new Error(`Matrix Traversal accepts ${maximumMatrixColumns} columns or fewer.`);
    }
    if (columnCount === null) columnCount = values.length;
    if (values.length !== columnCount) {
      throw new Error("Every matrix row must contain the same number of values.");
    }

    for (let column = 0; column < values.length; column += 1) {
      if (!Object.hasOwn(values, column) || !Number.isFinite(values[column])) {
        throw new Error("Matrix Traversal only accepts finite numbers in every cell.");
      }
    }
  }

  return matrix;
}

export function traverseMatrix(matrix) {
  validateMatrixInput(matrix);

  const values = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      values.push(matrix[row][column]);
    }
  }
  return values;
}
