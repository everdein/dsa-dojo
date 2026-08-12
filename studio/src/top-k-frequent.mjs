import {
  frequencyEntries,
  topKFrequent,
  validateTopKFrequentInput
} from "../../heaps-and-priority-queues/top-k-frequent.mjs";
import { formatNumber } from "./input.mjs";

export { topKFrequent };

export function buildTopKFrequentTrace({ values, k }) {
  validateTopKFrequentInput(values, k);
  const trace = [];
  const counts = new Map();
  const entries = frequencyEntries(values);
  const heap = [];
  const selectedValues = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-counts"],
    values,
    k,
    entries,
    counts,
    heap,
    currentEntry: null,
    selectedValues,
    narration: "First count every distinct value. Then a bounded min-heap will retain only the best k candidates.",
    prompt: "Which values will share one count entry?"
  }));

  for (let index = 0; index < values.length; index += 1) {
    const value = Object.is(values[index], -0) ? 0 : values[index];
    counts.set(value, (counts.get(value) ?? 0) + 1);
    trace.push(createStep({
      trace,
      phase: "count",
      codeSteps: ["count-values"],
      values,
      k,
      entries,
      counts,
      heap,
      currentEntry: entries.find((entry) => Object.is(entry.value, value) || entry.value === value),
      selectedValues,
      narration: `${formatNumber(value)} has now appeared ${counts.get(value)} ${counts.get(value) === 1 ? "time" : "times"}.`,
      prompt: "Will this frequency be large enough to survive in a k-sized heap?"
    }));
  }

  for (const entry of entries) {
    heap.push({ ...entry });
    siftUp(heap, heap.length - 1);
    trace.push(createStep({
      trace,
      phase: "offer",
      codeSteps: ["offer-entry", "sift-up"],
      values,
      k,
      entries,
      counts,
      heap,
      currentEntry: entry,
      selectedValues,
      activeHeapValue: entry.value,
      narration: `Offer ${formatNumber(entry.value)} with frequency ${entry.count} to the min-heap.`,
      prompt: heap.length > k ? "Which weakest candidate must leave?" : "How many candidate slots remain?"
    }));

    if (heap.length > k) {
      const removed = removeMinimum(heap);
      trace.push(createStep({
        trace,
        phase: "trim",
        codeSteps: ["trim-heap", "sift-down"],
        values,
        k,
        entries,
        counts,
        heap,
        currentEntry: entry,
        selectedValues,
        narration: `Remove ${formatNumber(removed.value)} with frequency ${removed.count}; only k stronger candidates remain.`,
        prompt: "Why is the root the correct candidate to discard?"
      }));
    }
  }

  selectedValues.push(...[...heap]
    .sort((left, right) => right.count - left.count || left.firstIndex - right.firstIndex)
    .map(({ value }) => value));
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      values,
      k,
      entries,
      counts,
      heap,
      currentEntry: null,
      selectedValues,
      narration: `The bounded heap retained the ${k} most frequent ${k === 1 ? "value" : "values"}. Sort those survivors for a deterministic result.`,
      prompt: "How does limiting the heap to k change the cost when k is much smaller than the number of distinct values?"
    }),
    result: [...selectedValues]
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  k,
  entries,
  counts,
  heap,
  currentEntry,
  selectedValues,
  narration,
  prompt,
  activeHeapValue = null
}) {
  const nodes = heap.map((entry) => ({ id: nodeId(entry), value: `${formatNumber(entry.value)} × ${entry.count}` }));
  return {
    step: trace.length,
    phase,
    codeSteps,
    k,
    distinctCount: entries.length,
    processedDistinct: heap.length,
    currentValue: currentEntry?.value ?? null,
    currentCount: currentEntry?.count ?? null,
    heapSize: heap.length,
    selectedValues: [...selectedValues],
    views: {
      counts: {
        entries: entries
          .filter(({ value }) => counts.has(value))
          .map((entry) => ({
            key: numberKey(entry.value),
            value: counts.get(entry.value),
            state: selectedValues.includes(entry.value) ? "result" : "counted"
          })),
        activeKeys: currentEntry && counts.has(currentEntry.value) ? [numberKey(currentEntry.value)] : [],
        annotations: currentEntry && counts.has(currentEntry.value) ? [{ key: numberKey(currentEntry.value), label: `frequency ${counts.get(currentEntry.value)}` }] : [],
        resultKeys: selectedValues.map(numberKey)
      },
      heap: {
        nodes,
        edges: heap.slice(1).map((entry, index) => ({
          id: `edge-${index + 1}`,
          fromId: nodeId(heap[Math.floor(index / 2)]),
          toId: nodeId(entry)
        })),
        rootIds: nodes.length ? [nodes[0].id] : [],
        activeNodeIds: activeHeapValue === null ? [] : nodes.filter((node) => node.id === nodeIdForValue(entries, activeHeapValue)).map(({ id }) => id),
        changedNodeIds: [],
        states: selectedValues.map((value) => ({ nodeId: nodeIdForValue(entries, value), kind: "result", label: "top k" })).filter(({ nodeId }) => nodes.some((node) => node.id === nodeId)),
        annotations: heap.map((entry, index) => ({ nodeId: nodeId(entry), label: `heap index ${index}` })),
        pointers: nodes.length ? [{ nodeId: nodes[0].id, kind: "minimum", label: "weakest" }] : []
      }
    },
    narration,
    prompt
  };
}

function nodeId(entry) {
  return `node-${entry.firstIndex}`;
}

function nodeIdForValue(entries, value) {
  return nodeId(entries.find((entry) => Object.is(entry.value, value) || entry.value === value));
}

function numberKey(value) {
  return Object.is(value, -0) ? "0" : String(value);
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
    if (compare(heap[parent], heap[index]) <= 0) return;
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
    if (left < heap.length && compare(heap[left], heap[smallest]) < 0) smallest = left;
    if (right < heap.length && compare(heap[right], heap[smallest]) < 0) smallest = right;
    if (smallest === index) return;
    [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
    index = smallest;
  }
}

function compare(left, right) {
  return left.count - right.count || right.firstIndex - left.firstIndex;
}
