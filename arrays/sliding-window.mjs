export function validateSlidingWindowInput(values, size) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Sliding Window requires at least one value.");
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Sliding Window only accepts finite numbers.");
    }
  }
  if (!Number.isInteger(size) || size < 1 || size > values.length) {
    throw new Error("Window size must be a positive integer no larger than the array.");
  }
  return { values, size };
}

export function maxWindowSum(values, size) {
  validateSlidingWindowInput(values, size);

  let windowSum = 0;
  for (let index = 0; index < size; index += 1) {
    windowSum += values[index];
    assertFiniteWindowSum(windowSum);
  }

  let bestSum = windowSum;
  let bestStart = 0;

  for (let end = size; end < values.length; end += 1) {
    windowSum += values[end] - values[end - size];
    assertFiniteWindowSum(windowSum);
    if (windowSum > bestSum) {
      bestSum = windowSum;
      bestStart = end - size + 1;
    }
  }

  return {
    sum: bestSum,
    start: bestStart,
    end: bestStart + size - 1
  };
}

function assertFiniteWindowSum(sum) {
  if (!Number.isFinite(sum)) {
    throw new Error("Sliding Window sums must remain finite.");
  }
}
