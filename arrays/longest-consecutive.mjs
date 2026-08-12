export const maximumConsecutiveValues = 12;

export function validateLongestConsecutiveInput(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Longest Consecutive Sequence requires at least one value.");
  }
  if (values.length > maximumConsecutiveValues) {
    throw new Error(
      `Keep Longest Consecutive Sequence to ${maximumConsecutiveValues} values or fewer.`
    );
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isSafeInteger(values[index])) {
      throw new Error("Longest Consecutive Sequence only accepts safe integers.");
    }
  }
  return values;
}

/**
 * Finds the longest run of distinct consecutive safe integers in average O(n)
 * time. A value starts a run only when its predecessor is absent. Equal-length
 * runs keep the start encountered first in input order, making the result
 * deterministic without sorting. Negative zero is normalized to zero to match
 * JavaScript Set membership semantics.
 */
export function longestConsecutive(values) {
  validateLongestConsecutiveInput(values);

  const uniqueValues = [...new Set(values.map(normalizeConsecutiveValue))];
  const valueSet = new Set(uniqueValues);
  let best = null;

  for (const start of uniqueValues) {
    const hasPredecessor = start > Number.MIN_SAFE_INTEGER && valueSet.has(start - 1);
    if (hasPredecessor) continue;

    const streakValues = [start];
    let end = start;
    while (end < Number.MAX_SAFE_INTEGER && valueSet.has(end + 1)) {
      end += 1;
      streakValues.push(end);
    }

    const candidate = {
      length: streakValues.length,
      start,
      end,
      values: streakValues
    };
    if (best === null || candidate.length > best.length) best = candidate;
  }

  return { ...best, values: [...best.values] };
}

export function normalizeConsecutiveValue(value) {
  return Object.is(value, -0) ? 0 : value;
}
