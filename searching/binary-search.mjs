export const maximumBinarySearchValues = 12;

export function validateBinarySearchInput(values, target) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumBinarySearchValues) {
    throw new Error(`Binary Search requires 1-${maximumBinarySearchValues} sorted values.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Binary Search only accepts a dense array of finite numbers.");
    }
    if (index > 0 && values[index] < values[index - 1]) {
      throw new Error("Binary Search values must be sorted in nondecreasing order.");
    }
  }
  if (!Number.isFinite(target)) throw new Error("Binary Search requires a finite target.");
  return { values, target };
}

export function binarySearch(values, target) {
  validateBinarySearchInput(values, target);
  let left = 0;
  let right = values.length - 1;
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] === target) return middle;
    if (values[middle] < target) left = middle + 1;
    else right = middle - 1;
  }
  return -1;
}
