export const maximumDuplicateValues = 12;

export function validateFindDuplicatesInput(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Find Duplicates requires at least one value.");
  }
  if (values.length > maximumDuplicateValues) {
    throw new Error(`Keep Find Duplicates to ${maximumDuplicateValues} values or fewer.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Find Duplicates only accepts finite numbers.");
    }
  }
  return values;
}

/**
 * Returns each duplicate once, ordered by the index at which its second
 * occurrence is discovered. Set membership uses SameValueZero, so -0 and 0
 * identify the same value; zero results are normalized to 0.
 */
export function findDuplicates(values) {
  validateFindDuplicatesInput(values);

  const seen = new Set();
  const emitted = new Set();
  const duplicates = [];

  for (const value of values) {
    if (seen.has(value)) {
      if (!emitted.has(value)) {
        duplicates.push(canonicalResultValue(value));
        emitted.add(value);
      }
    } else {
      seen.add(value);
    }
  }

  return duplicates;
}

function canonicalResultValue(value) {
  return Object.is(value, -0) ? 0 : value;
}
