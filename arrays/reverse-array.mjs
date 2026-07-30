export function validateReverseArrayInput(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Reverse Array requires at least one value.");
  }

  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) {
      throw new Error("Reverse Array only accepts finite numbers.");
    }
  }

  return values;
}

export function reverseArray(values) {
  validateReverseArrayInput(values);

  const reversed = [...values];
  let left = 0;
  let right = reversed.length - 1;

  while (left < right) {
    const leftValue = reversed[left];
    reversed[left] = reversed[right];
    reversed[right] = leftValue;
    left += 1;
    right -= 1;
  }

  return reversed;
}
