export const maximumQuickSortValues = 12;

export function validateQuickSortInput(values) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumQuickSortValues) {
    throw new Error(`Quick Sort requires 1-${maximumQuickSortValues} values.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Quick Sort only accepts a dense array of finite numbers.");
    }
  }
  return values;
}

/**
 * Sorts a copy with deterministic Lomuto partitions. The last value in every
 * subrange is the pivot; values less than or equal to it move left. This pivot
 * rule is intentionally simple and exposes already sorted input as a worst
 * case rather than hiding that tradeoff behind randomization.
 */
export function quickSort(values) {
  validateQuickSortInput(values);
  const sorted = [...values];

  const sortRange = (start, end) => {
    if (start >= end) return;
    const pivotIndex = partitionQuickSortRange(sorted, start, end);
    sortRange(start, pivotIndex - 1);
    sortRange(pivotIndex + 1, end);
  };

  sortRange(0, sorted.length - 1);
  return sorted;
}

export function partitionQuickSortRange(values, start, end) {
  assertPartitionRange(values, start, end);
  const pivot = values[end];
  let boundary = start;

  for (let scan = start; scan < end; scan += 1) {
    if (values[scan] > pivot) continue;
    if (scan !== boundary) swap(values, scan, boundary);
    boundary += 1;
  }
  if (boundary !== end) swap(values, boundary, end);
  return boundary;
}

function assertPartitionRange(values, start, end) {
  validateQuickSortInput(values);
  if (
    !Number.isInteger(start)
    || !Number.isInteger(end)
    || start < 0
    || start >= end
    || end >= values.length
  ) {
    throw new Error("Quick Sort partition bounds must identify a nontrivial array subrange.");
  }
}

function swap(values, left, right) {
  [values[left], values[right]] = [values[right], values[left]];
}
