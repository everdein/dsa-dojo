export function validateMoveZerosInput(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Move Zeros requires at least one value.");
  }

  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) {
      throw new Error("Move Zeros only accepts finite numbers.");
    }
  }

  return values;
}

export function moveZeros(values) {
  validateMoveZerosInput(values);

  const result = [...values];
  let write = 0;

  for (let read = 0; read < result.length; read += 1) {
    if (result[read] === 0) continue;

    if (read !== write) {
      const readValue = result[read];
      result[read] = result[write];
      result[write] = readValue;
    }
    write += 1;
  }

  return result;
}
