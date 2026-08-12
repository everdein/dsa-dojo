export const maximumInsertionSortValues = 12;

export function validateInsertionSortInput(values) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumInsertionSortValues) {
    throw new Error(`Insertion Sort requires 1-${maximumInsertionSortValues} values.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Insertion Sort only accepts a dense array of finite numbers.");
    }
  }
  return values;
}

export function insertionSort(values) {
  validateInsertionSortInput(values);
  const sorted = [...values];
  for (let index = 1; index < sorted.length; index += 1) {
    const key = sorted[index];
    let position = index - 1;
    while (position >= 0 && sorted[position] > key) {
      sorted[position + 1] = sorted[position];
      position -= 1;
    }
    sorted[position + 1] = key;
  }
  return sorted;
}
