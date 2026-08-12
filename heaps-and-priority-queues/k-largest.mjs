import {
  siftDownMinHeap,
  siftUpMinHeap
} from "./heap-operations.mjs";

export const maximumKLargestValues = 12;

export function validateKLargestInput(values, k) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("K Largest Elements requires at least one value.");
  }
  if (values.length > maximumKLargestValues) {
    throw new Error(`Keep K Largest Elements to ${maximumKLargestValues} values or fewer.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("K Largest Elements only accepts finite numbers.");
    }
  }
  if (!Number.isInteger(k) || k < 1 || k > values.length) {
    throw new Error("K must be a positive integer no larger than the input length.");
  }
  return { values, k };
}

/**
 * Keeps at most k candidates in a min-heap. Once full, the root is the
 * smallest kept value and therefore the only candidate an incoming value
 * needs to beat. The returned values are sorted descending for a stable,
 * learner-friendly result.
 */
export function kLargest(values, k) {
  validateKLargestInput(values, k);

  const heap = [];
  for (const value of values) {
    if (heap.length < k) {
      heap.push(value);
      siftUpMinHeap(heap, heap.length - 1);
      continue;
    }
    if (value <= heap[0]) continue;

    heap[0] = value;
    siftDownMinHeap(heap, 0);
  }

  return [...heap].sort(descendingNumberOrder);
}

function descendingNumberOrder(left, right) {
  if (left > right) return -1;
  if (left < right) return 1;
  return 0;
}
