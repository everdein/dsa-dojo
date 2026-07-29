export function validateInput(values) {
  if (!Array.isArray(values) || values.length < 1) {
    throw new Error("Enter at least one value.");
  }

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Every value must be a finite number.");
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
