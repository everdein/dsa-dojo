import { countFrequencies } from "../arrays/frequency-count.mjs";

export const maximumTopKFrequentValues = 12;

export function validateTopKFrequentInput(values, k) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumTopKFrequentValues) {
    throw new Error(`Top K Frequent requires 1-${maximumTopKFrequentValues} values.`);
  }
  const distinct = new Set();
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Top K Frequent only accepts a dense array of finite numbers.");
    }
    distinct.add(normalizeZero(values[index]));
  }
  if (!Number.isInteger(k) || k < 1 || k > distinct.size) {
    throw new Error(`k must be an integer from 1 through the ${distinct.size} distinct values.`);
  }
  return { values, k };
}

export function topKFrequent(values, k) {
  validateTopKFrequentInput(values, k);
  const entries = frequencyEntries(values);
  const heap = [];
  for (const entry of entries) {
    heap.push(entry);
    siftUp(heap, heap.length - 1);
    if (heap.length > k) removeMinimum(heap);
  }
  return [...heap]
    .sort((left, right) => right.count - left.count || left.firstIndex - right.firstIndex)
    .map(({ value }) => value);
}

export function frequencyEntries(values) {
  const firstIndexByValue = new Map();
  values.forEach((rawValue, index) => {
    const value = normalizeZero(rawValue);
    if (!firstIndexByValue.has(value)) firstIndexByValue.set(value, index);
  });
  return countFrequencies(values).map(({ value, count }) => ({
    value: normalizeZero(value),
    count,
    firstIndex: firstIndexByValue.get(normalizeZero(value))
  }));
}

function removeMinimum(heap) {
  const minimum = heap[0];
  const last = heap.pop();
  if (heap.length) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return minimum;
}

function siftUp(heap, startIndex) {
  let index = startIndex;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (compareEntries(heap[parent], heap[index]) <= 0) break;
    [heap[parent], heap[index]] = [heap[index], heap[parent]];
    index = parent;
  }
}

function siftDown(heap, startIndex) {
  let index = startIndex;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    let smallest = index;
    if (left < heap.length && compareEntries(heap[left], heap[smallest]) < 0) smallest = left;
    if (right < heap.length && compareEntries(heap[right], heap[smallest]) < 0) smallest = right;
    if (smallest === index) return;
    [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
    index = smallest;
  }
}

// Lower frequency is worse. For equal frequency, later first occurrence is
// worse so earlier values win deterministic ties in the final result.
function compareEntries(left, right) {
  return left.count - right.count || right.firstIndex - left.firstIndex;
}

function normalizeZero(value) {
  return Object.is(value, -0) ? 0 : value;
}
