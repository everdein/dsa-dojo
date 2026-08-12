export const maximumSlidingWindowValues = 12;

export function validateSlidingWindowMaximumInput(values, size) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Sliding Window Maximum requires at least one value.");
  }
  if (values.length > maximumSlidingWindowValues) {
    throw new Error(
      `Keep Sliding Window Maximum to ${maximumSlidingWindowValues} values or fewer.`
    );
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Sliding Window Maximum only accepts finite numbers.");
    }
  }
  if (!Number.isInteger(size) || size < 1 || size > values.length) {
    throw new Error("Window size must be a positive integer no larger than the array.");
  }
  return { values, size };
}

/**
 * Returns one maximum for every fixed-size window. Candidate indices stay in
 * increasing index order and strictly decreasing value order. Equal incoming
 * values replace older equals because the newer index remains useful longer.
 */
export function slidingWindowMaximum(values, size) {
  validateSlidingWindowMaximumInput(values, size);

  const candidates = [];
  const maxima = [];
  let front = 0;

  for (let index = 0; index < values.length; index += 1) {
    const windowStart = index - size + 1;
    while (front < candidates.length && candidates[front] < windowStart) front += 1;
    if (front === size) {
      candidates.splice(0, front);
      front = 0;
    }
    while (
      candidates.length > front
      && values[candidates.at(-1)] <= values[index]
    ) {
      candidates.pop();
    }
    candidates.push(index);
    if (windowStart >= 0) maxima.push(values[candidates[front]]);
  }

  return maxima;
}
