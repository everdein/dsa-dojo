import {
  runHeapOperations,
  siftDownMinHeap,
  siftUpMinHeap,
  validateHeapOperations
} from "../../heaps-and-priority-queues/heap-operations.mjs";
import { formatNumber } from "./input.mjs";

export { runHeapOperations };

export function buildHeapOperationsTrace(operations) {
  validateHeapOperations(operations);

  const heap = [];
  const removed = [];
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    heap,
    removed,
    operationIndex: null,
    operation: null,
    narration: "Start with an empty min-heap. Array indices provide complete-tree positions without storing links.",
    prompt: "When the first value arrives, which array index is also the tree root?"
  }));

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];

    if (operation.type === "insert") {
      const insertedIndex = heap.length;
      heap.push(operation.value);
      const plannedHeap = [...heap];
      const swaps = siftUpMinHeap(plannedHeap, insertedIndex);

      trace.push(createStep({
        trace,
        phase: "insert-append",
        codeSteps: ["read-operation", "append-value"],
        heap,
        removed,
        operationIndex,
        operation,
        activeIndices: [insertedIndex],
        changedIndices: [insertedIndex],
        markers: [{ index: insertedIndex, kind: "inserted", label: "new leaf" }],
        annotations: [{
          index: insertedIndex,
          label: swaps.length ? "compare with parent" : "already settled"
        }],
        narration: `Append ${formatNumber(operation.value)} at index ${insertedIndex}, the next open complete-tree position.`,
        prompt: swaps.length
          ? "Is the new value smaller than its parent?"
          : "Why is no sift-up swap needed?"
      }));

      for (const [childIndex, parentIndex] of swaps) {
        const risingValue = heap[childIndex];
        const fallingValue = heap[parentIndex];
        swap(heap, childIndex, parentIndex);
        trace.push(createStep({
          trace,
          phase: "sift-up-swap",
          codeSteps: ["compare-parent", "swap-up"],
          heap,
          removed,
          operationIndex,
          operation,
          activeIndices: [parentIndex, childIndex],
          changedIndices: [parentIndex, childIndex],
          markers: [
            { index: parentIndex, kind: "rising", label: "smaller value rises" },
            { index: childIndex, kind: "falling", label: "parent moves down" }
          ],
          annotations: [
            { index: parentIndex, label: `${formatNumber(risingValue)} moved up` },
            { index: childIndex, label: `${formatNumber(fallingValue)} moved down` }
          ],
          narration: `${formatNumber(risingValue)} is smaller than parent ${formatNumber(fallingValue)}, so swap indices ${childIndex} and ${parentIndex}.`,
          prompt: parentIndex > 0
            ? "Does the rising value also violate order with its new parent?"
            : "The value reached the root. Why must sift-up stop?"
        }));
      }
      continue;
    }

    const minimum = heap[0];
    trace.push(createStep({
      trace,
      phase: "remove-minimum",
      codeSteps: ["read-operation", "read-minimum"],
      heap,
      removed,
      operationIndex,
      operation,
      activeIndices: [0],
      markers: [{ index: 0, kind: "removed", label: "minimum to remove" }],
      annotations: [{ index: 0, label: `output ${formatNumber(minimum)}` }],
      narration: `The root is the minimum, so remove will output ${formatNumber(minimum)}.`,
      prompt: heap.length === 1
        ? "What remains after removing this only node?"
        : "Which value can fill the root without breaking complete-tree shape?"
    }));

    const lastIndex = heap.length - 1;
    const lastValue = heap.pop();
    const removal = { operationIndex, type: "remove", value: minimum };
    removed.push(removal);

    if (heap.length === 0) {
      trace.push(createStep({
        trace,
        phase: "remove-singleton",
        codeSteps: ["remove-last", "record-removal"],
        heap,
        removed,
        operationIndex,
        operation,
        narration: `Remove the only node and record minimum ${formatNumber(minimum)}. The heap is now empty.`,
        prompt: "Why does an empty heap need no sift-down work?"
      }));
      continue;
    }

    heap[0] = lastValue;
    const plannedHeap = [...heap];
    const swaps = siftDownMinHeap(plannedHeap, 0);
    trace.push(createStep({
      trace,
      phase: "replace-root",
      codeSteps: ["remove-last", "replace-root", "record-removal"],
      heap,
      removed,
      operationIndex,
      operation,
      activeIndices: [0],
      changedIndices: [0],
      markers: [{ index: 0, kind: "replacement", label: "last value moved to root" }],
      annotations: [{
        index: 0,
        label: swaps.length ? "compare with smaller child" : "already settled"
      }],
      narration: `Move last value ${formatNumber(lastValue)} from index ${lastIndex} to the root, preserving compact complete-tree storage.`,
      prompt: swaps.length
        ? "Which child is smaller and should trade places with the root?"
        : "Why is the replacement already in min-heap order?"
    }));

    for (const [parentIndex, childIndex] of swaps) {
      const fallingValue = heap[parentIndex];
      const risingValue = heap[childIndex];
      swap(heap, parentIndex, childIndex);
      trace.push(createStep({
        trace,
        phase: "sift-down-swap",
        codeSteps: ["choose-smaller-child", "swap-down"],
        heap,
        removed,
        operationIndex,
        operation,
        activeIndices: [parentIndex, childIndex],
        changedIndices: [parentIndex, childIndex],
        markers: [
          { index: parentIndex, kind: "rising", label: "smaller child rises" },
          { index: childIndex, kind: "falling", label: "replacement moves down" }
        ],
        annotations: [
          { index: parentIndex, label: `${formatNumber(risingValue)} moved up` },
          { index: childIndex, label: `${formatNumber(fallingValue)} moved down` }
        ],
        narration: `Child ${formatNumber(risingValue)} is smaller than ${formatNumber(fallingValue)}, so swap indices ${parentIndex} and ${childIndex}.`,
        prompt: "Does the falling value still violate order with either child?"
      }));
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-result"],
      heap,
      removed,
      operationIndex: null,
      operation: null,
      narration: `All ${operations.length} operations are complete. The final heap has ${heap.length} ${heap.length === 1 ? "value" : "values"}, and ${removed.length} ${removed.length === 1 ? "minimum was" : "minima were"} removed.`,
      prompt: "How do the array positions preserve complete-tree shape while swaps restore heap order?"
    }),
    result: {
      removed: removed.map((entry) => ({ ...entry })),
      heap: [...heap]
    }
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  heap,
  removed,
  operationIndex,
  operation,
  narration,
  prompt,
  activeIndices = [],
  changedIndices = [],
  markers = [],
  annotations = []
}) {
  const heapOrdered = isMinHeap(heap);
  return {
    step: trace.length,
    phase,
    codeSteps: [...codeSteps],
    operationIndex,
    operation: operation === null ? null : { ...operation },
    heapSize: heap.length,
    minimum: heap[0] ?? null,
    heapOrdered,
    removedCount: removed.length,
    removed: removed.map((entry) => ({ ...entry })),
    latestRemoval: removed.length ? { ...removed.at(-1) } : null,
    activeIndices: [...activeIndices],
    views: {
      heap: buildArrayView(heap, activeIndices, changedIndices, markers, annotations),
      tree: buildTreeView(heap, activeIndices, changedIndices, annotations)
    },
    narration,
    prompt
  };
}

function buildArrayView(heap, activeIndices, changedIndices, markers, annotations) {
  const rootMarker = heap.length
    ? [{ index: 0, kind: "minimum", label: "heap root" }]
    : [];
  return {
    values: [...heap],
    activeIndices: [...activeIndices],
    ranges: heap.length
      ? [{ start: 0, end: heap.length - 1, kind: "heap", label: "complete-tree storage" }]
      : [],
    markers: [...rootMarker, ...markers.map((marker) => ({ ...marker }))],
    annotations: annotations.map((annotation) => ({ ...annotation })),
    changedIndices: [...changedIndices]
  };
}

function buildTreeView(heap, activeIndices, changedIndices, annotations) {
  const nodes = heap.map((value, index) => ({ id: nodeId(index), value }));
  const edges = [];
  for (let childIndex = 1; childIndex < heap.length; childIndex += 1) {
    const parentIndex = Math.floor((childIndex - 1) / 2);
    edges.push({
      id: `edge-${parentIndex}-${childIndex}`,
      fromId: nodeId(parentIndex),
      toId: nodeId(childIndex),
      label: childIndex === parentIndex * 2 + 1 ? "left" : "right"
    });
  }
  return {
    nodes,
    edges,
    rootIds: heap.length ? [nodeId(0)] : [],
    activeNodeIds: activeIndices.map(nodeId),
    changedNodeIds: changedIndices.map(nodeId),
    states: heap.length
      ? [{ nodeId: nodeId(0), kind: "minimum", label: "minimum at root" }]
      : [],
    annotations: annotations.map(({ index, label }) => ({ nodeId: nodeId(index), label })),
    pointers: [{
      nodeId: activeIndices.length ? nodeId(activeIndices[0]) : null,
      kind: "current",
      label: "current heap position"
    }]
  };
}

function isMinHeap(heap) {
  for (let childIndex = 1; childIndex < heap.length; childIndex += 1) {
    const parentIndex = Math.floor((childIndex - 1) / 2);
    if (heap[childIndex] < heap[parentIndex]) return false;
  }
  return true;
}

function nodeId(index) {
  return `node-${index}`;
}

function swap(heap, leftIndex, rightIndex) {
  [heap[leftIndex], heap[rightIndex]] = [heap[rightIndex], heap[leftIndex]];
}
