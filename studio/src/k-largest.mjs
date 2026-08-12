import {
  kLargest,
  validateKLargestInput
} from "../../heaps-and-priority-queues/k-largest.mjs";
import {
  siftDownMinHeap,
  siftUpMinHeap
} from "../../heaps-and-priority-queues/heap-operations.mjs";
import { formatNumber } from "./input.mjs";

export { kLargest };

export function buildKLargestTrace({ values, k }) {
  validateKLargestInput(values, k);

  const heap = [];
  const decisions = new Map();
  const trace = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (heap.length > 0) {
      trace.push(createStep({
        trace,
        phase: "inspect",
        codeSteps: ["read-value"],
        values,
        k,
        heap,
        decisions,
        currentIndex: index,
        processedCount: index,
        decision: "pending",
        replacedValue: null,
        swapIndices: [],
        activeHeapIndices: heap.length === k ? [0] : [],
        changedHeapIndices: [],
        heapAnnotations: heap.length === k
          ? [{ index: 0, label: `threshold ${formatNumber(heap[0])}` }]
          : [],
        narration: heap.length < k
          ? `Read ${formatNumber(value)}. The bounded heap still has ${k - heap.length} open ${k - heap.length === 1 ? "slot" : "slots"}.`
          : `Read ${formatNumber(value)} and compare it with the kept minimum ${formatNumber(heap[0])}.`,
        prompt: heap.length < k
          ? "Can this value be accepted without evicting another candidate?"
          : "Does this value exceed the smallest candidate currently kept?"
      }));
    }

    if (heap.length < k) {
      heap.push(value);
      decisions.set(index, "accepted");
      const insertedSlot = heap.length - 1;
      trace.push(createStep({
        trace,
        phase: "accept-under-capacity",
        codeSteps: trace.length === 0
          ? ["initialize", "read-value", "accept-under-capacity"]
          : ["accept-under-capacity"],
        values,
        k,
        heap,
        decisions,
        currentIndex: index,
        processedCount: index + 1,
        decision: "accepted",
        replacedValue: null,
        swapIndices: [],
        activeHeapIndices: [insertedSlot],
        changedHeapIndices: [insertedSlot],
        heapAnnotations: [{ index: insertedSlot, label: "accepted into open slot" }],
        narration: index === 0
          ? `Initialize the min-heap by accepting ${formatNumber(value)} into slot 0.`
          : `Accept ${formatNumber(value)} into open heap slot ${insertedSlot}.`,
        prompt: "Does this new leaf need to sift toward the root?"
      }));
      replaySift({
        direction: "up",
        heap,
        startIndex: insertedSlot,
        trace,
        values,
        k,
        decisions,
        currentIndex: index,
        processedCount: index + 1
      });
      continue;
    }

    if (value <= heap[0]) {
      decisions.set(index, "rejected");
      trace.push(createStep({
        trace,
        phase: "reject",
        codeSteps: ["reject"],
        values,
        k,
        heap,
        decisions,
        currentIndex: index,
        processedCount: index + 1,
        decision: "rejected",
        replacedValue: null,
        swapIndices: [],
        activeHeapIndices: [0],
        changedHeapIndices: [],
        heapAnnotations: [{ index: 0, label: "smallest kept still wins" }],
        narration: `${formatNumber(value)} does not exceed the kept minimum ${formatNumber(heap[0])}, so it cannot belong to a larger top-${k} result.`,
        prompt: "Why is comparing only with the heap root sufficient?"
      }));
      continue;
    }

    const replacedValue = heap[0];
    heap[0] = value;
    decisions.set(index, "accepted");
    trace.push(createStep({
      trace,
      phase: "replace-minimum",
      codeSteps: ["replace-minimum"],
      values,
      k,
      heap,
      decisions,
      currentIndex: index,
      processedCount: index + 1,
      decision: "accepted",
      replacedValue,
      swapIndices: [],
      activeHeapIndices: [0],
      changedHeapIndices: [0],
      heapAnnotations: [{ index: 0, label: `replaced ${formatNumber(replacedValue)}` }],
      narration: `${formatNumber(value)} exceeds ${formatNumber(replacedValue)}, so replace the root while keeping the heap bounded at ${k}.`,
      prompt: "Which child should the new root compare with while restoring min-heap order?"
    }));
    replaySift({
      direction: "down",
      heap,
      startIndex: 0,
      trace,
      values,
      k,
      decisions,
      currentIndex: index,
      processedCount: index + 1,
      replacedValue
    });
  }

  const result = kLargest(values, k);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      values,
      k,
      heap,
      decisions,
      currentIndex: null,
      processedCount: values.length,
      decision: "complete",
      replacedValue: null,
      swapIndices: [],
      activeHeapIndices: [0],
      changedHeapIndices: [],
      heapAnnotations: [{ index: 0, label: "smallest top-k value" }],
      narration: `The bounded heap contains the ${k} largest ${k === 1 ? "value" : "values"}; sort its small candidate set descending to return ${formatValues(result)}.`,
      prompt: "Why did the heap never need to store more than k values?"
    }),
    result: [...result]
  });

  return trace;
}

export function heapSlotId(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("Heap slot ids require non-negative integer indices.");
  }
  return `heap-slot-${index}`;
}

function replaySift({
  direction,
  heap,
  startIndex,
  trace,
  values,
  k,
  decisions,
  currentIndex,
  processedCount,
  replacedValue = null
}) {
  const plannedHeap = [...heap];
  const swaps = direction === "up"
    ? siftUpMinHeap(plannedHeap, startIndex)
    : siftDownMinHeap(plannedHeap, startIndex);

  for (const [firstIndex, secondIndex] of swaps) {
    [heap[firstIndex], heap[secondIndex]] = [heap[secondIndex], heap[firstIndex]];
    trace.push(createStep({
      trace,
      phase: direction === "up" ? "sift-up" : "sift-down",
      codeSteps: [direction === "up" ? "sift-up" : "sift-down"],
      values,
      k,
      heap,
      decisions,
      currentIndex,
      processedCount,
      decision: "accepted",
      replacedValue,
      swapIndices: [firstIndex, secondIndex],
      activeHeapIndices: [firstIndex, secondIndex],
      changedHeapIndices: [firstIndex, secondIndex],
      heapAnnotations: [
        { index: firstIndex, label: `swapped with slot ${secondIndex}` },
        { index: secondIndex, label: `swapped with slot ${firstIndex}` }
      ],
      narration: `Swap heap slots ${firstIndex} and ${secondIndex}. Values move between stable slot positions to restore min-heap order.`,
      prompt: direction === "up"
        ? "Does the moved value still violate order with its parent?"
        : "Does the moved value still violate order with its smaller child?"
    }));
  }
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  k,
  heap,
  decisions,
  currentIndex,
  processedCount,
  decision,
  replacedValue,
  swapIndices,
  activeHeapIndices,
  changedHeapIndices,
  heapAnnotations,
  narration,
  prompt
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentValue: currentIndex === null ? null : values[currentIndex],
    processedCount,
    k,
    decision,
    replacedValue,
    swapIndices: [...swapIndices],
    heapSize: heap.length,
    capacityRemaining: k - heap.length,
    minimumKept: Math.min(...heap),
    heapValues: [...heap],
    currentTopK: sortedDescending(heap),
    views: {
      values: buildInputView(values, currentIndex, processedCount, decisions, decision),
      heap: buildHeapArrayView(heap, activeHeapIndices, changedHeapIndices, heapAnnotations),
      tree: buildHeapTreeView(heap, activeHeapIndices, changedHeapIndices, heapAnnotations)
    },
    narration,
    prompt
  };
}

function buildInputView(values, currentIndex, processedCount, decisions, decision) {
  return {
    values: [...values],
    activeIndices: currentIndex === null ? [] : [currentIndex],
    ranges: processedCount === 0 ? [] : [{
      start: 0,
      end: processedCount - 1,
      kind: "processed",
      label: "processed prefix"
    }],
    markers: currentIndex === null ? [] : [{
      index: currentIndex,
      kind: decision === "rejected" ? "rejected" : decision === "pending" ? "incoming" : "accepted",
      label: decision === "rejected" ? "rejected" : decision === "pending" ? "incoming" : "accepted"
    }],
    annotations: currentIndex === null || !decisions.has(currentIndex)
      ? []
      : [{ index: currentIndex, label: decisions.get(currentIndex) }],
    changedIndices: []
  };
}

function buildHeapArrayView(heap, activeIndices, changedIndices, annotations) {
  const minimumIndex = minimumHeapIndex(heap);
  const markerByIndex = new Map([[
    minimumIndex,
    { index: minimumIndex, kind: "minimum", label: "smallest kept" }
  ]]);
  for (const index of activeIndices) {
    markerByIndex.set(index, {
      index,
      kind: "active",
      label: "active heap slot"
    });
  }
  return {
    values: [...heap],
    activeIndices: [...activeIndices],
    ranges: [{
      start: 0,
      end: heap.length - 1,
      kind: "candidates",
      label: "bounded candidates"
    }],
    markers: [...markerByIndex.values()],
    annotations: annotations.map((annotation) => ({ ...annotation })),
    changedIndices: [...changedIndices]
  };
}

function buildHeapTreeView(heap, activeIndices, changedIndices, annotations) {
  const minimumIndex = minimumHeapIndex(heap);
  return {
    nodes: heap.map((value, index) => ({ id: heapSlotId(index), value })),
    edges: heap.slice(1).map((_, index) => {
      const childIndex = index + 1;
      const parentIndex = Math.floor((childIndex - 1) / 2);
      return {
        id: `heap-edge-${parentIndex}-${childIndex}`,
        fromId: heapSlotId(parentIndex),
        toId: heapSlotId(childIndex),
        label: childIndex === parentIndex * 2 + 1 ? "left" : "right"
      };
    }),
    rootIds: [heapSlotId(0)],
    activeNodeIds: activeIndices.map(heapSlotId),
    changedNodeIds: changedIndices.map(heapSlotId),
    states: heap.map((_, index) => ({
      nodeId: heapSlotId(index),
      kind: index === minimumIndex ? "minimum" : "candidate",
      label: index === minimumIndex ? "smallest kept" : "kept candidate"
    })),
    annotations: annotations.map(({ index, label }) => ({
      nodeId: heapSlotId(index),
      label
    })),
    pointers: [{ nodeId: heapSlotId(minimumIndex), kind: "minimum", label: "minimum kept" }]
  };
}

function minimumHeapIndex(heap) {
  let minimumIndex = 0;
  for (let index = 1; index < heap.length; index += 1) {
    if (heap[index] < heap[minimumIndex]) minimumIndex = index;
  }
  return minimumIndex;
}

function sortedDescending(values) {
  return [...values].sort((left, right) => {
    if (left > right) return -1;
    if (left < right) return 1;
    return 0;
  });
}

function formatValues(values) {
  return `[${values.map(formatNumber).join(", ")}]`;
}
