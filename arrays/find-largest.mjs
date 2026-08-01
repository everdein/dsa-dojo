export function validateInput(values) {
  if (!Array.isArray(values) || values.length < 1) {
    throw new Error("Enter at least one value.");
  }

  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Every value must be a finite number.");
    }
  }

  return values;
}

export function findLargest(values) {
  validateInput(values);

  let largest = values[0];
  for (let index = 1; index < values.length; index += 1) {
    if (largest < values[index]) {
      largest = values[index];
    }
  }

  return largest;
}
