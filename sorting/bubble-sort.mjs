export const maximumBubbleSortValues = 12;

export function validateBubbleSortInput(values) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumBubbleSortValues) {
    throw new Error(`Bubble Sort requires 1-${maximumBubbleSortValues} values.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Bubble Sort only accepts a dense array of finite numbers.");
    }
  }
  return values;
}

export function bubbleSort(values) {
  validateBubbleSortInput(values);
  const sorted = [...values];
  for (let end = sorted.length - 1; end > 0; end -= 1) {
    let swapped = false;
    for (let index = 0; index < end; index += 1) {
      if (sorted[index] <= sorted[index + 1]) continue;
      [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
      swapped = true;
    }
    if (!swapped) break;
  }
  return sorted;
}
