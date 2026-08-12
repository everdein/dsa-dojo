export const maximumPairSumValues = 12;

export function validatePairSumInput(values, target) {
  if (!Array.isArray(values) || values.length < 2) {
    throw new Error("Pair Sum requires at least two values.");
  }
  if (values.length > maximumPairSumValues) {
    throw new Error(`Keep Pair Sum to ${maximumPairSumValues} values or fewer.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Pair Sum only accepts finite numbers.");
    }
  }
  if (!Number.isFinite(target)) {
    throw new Error("Pair Sum requires a finite target.");
  }
  return { values, target };
}

/**
 * Returns the first pair discovered by a left-to-right one-pass complement
 * lookup. Duplicate values are valid, and each pair uses two distinct indices.
 */
export function findPairSum(values, target) {
  validatePairSumInput(values, target);

  const earliestIndexByValue = new Map();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const complement = target - value;

    if (Number.isFinite(complement) && earliestIndexByValue.has(complement)) {
      const leftIndex = earliestIndexByValue.get(complement);
      return {
        indices: [leftIndex, index],
        values: [values[leftIndex], value]
      };
    }

    if (!earliestIndexByValue.has(value)) {
      earliestIndexByValue.set(value, index);
    }
  }

  return null;
}
