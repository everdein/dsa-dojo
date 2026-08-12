export const maximumMergeSortValues = 8;

export function validateMergeSortInput(values) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumMergeSortValues) {
    throw new Error(`Merge Sort requires 1-${maximumMergeSortValues} values.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Merge Sort only accepts a dense array of finite numbers.");
    }
  }
  return values;
}

export function mergeSortedValues(left, right) {
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] <= right[rightIndex]) merged.push(left[leftIndex++]);
    else merged.push(right[rightIndex++]);
  }
  merged.push(...left.slice(leftIndex), ...right.slice(rightIndex));
  return merged;
}

export function mergeSort(values) {
  validateMergeSortInput(values);
  if (values.length === 1) return [...values];
  const middle = Math.floor(values.length / 2);
  return mergeSortedValues(
    mergeSort(values.slice(0, middle)),
    mergeSort(values.slice(middle))
  );
}
