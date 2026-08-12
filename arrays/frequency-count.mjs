export const maximumFrequencyValues = 12;

export function validateFrequencyInput(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Frequency Count requires at least one value.");
  }
  if (values.length > maximumFrequencyValues) {
    throw new Error(`Keep Frequency Count to ${maximumFrequencyValues} values or fewer.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Frequency Count only accepts finite numbers.");
    }
  }
  return values;
}

/**
 * Returns distinct values in first-seen order with their occurrence counts.
 * Zero and negative zero share one bucket, matching JavaScript Map semantics.
 */
export function countFrequencies(values) {
  validateFrequencyInput(values);

  const counts = new Map();
  for (const value of values) {
    const normalizedValue = Object.is(value, -0) ? 0 : value;
    const previous = counts.get(normalizedValue) ?? 0;
    counts.set(normalizedValue, previous + 1);
  }

  return [...counts].map(([value, count]) => ({ value, count }));
}
