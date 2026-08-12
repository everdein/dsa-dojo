export const maximumHeapOperations = 12;

const decimalNumberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function parseHeapProgram(program) {
  if (typeof program !== "string" || program.trim() === "") {
    throw new Error("Enter at least one Heap operation.");
  }

  const tokens = program.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter one Heap operation between each comma.");
  }

  const operations = tokens.map((token, index) => parseOperation(token, index));
  validateHeapOperations(operations);
  return operations;
}

export function formatHeapProgram(operations) {
  validateHeapOperations(operations);
  return operations.map((operation) => (
    operation.type === "insert"
      ? `insert ${formatFiniteNumber(operation.value)}`
      : "remove"
  )).join(", ");
}

export function validateHeapOperations(operations) {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("Heap Operations requires at least one operation.");
  }
  if (operations.length > maximumHeapOperations) {
    throw new Error(`Keep Heap Operations to ${maximumHeapOperations} operations or fewer.`);
  }

  let size = 0;
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (!Object.hasOwn(operations, index) || !operation || typeof operation !== "object") {
      throw new Error(`Operation ${index + 1} is invalid.`);
    }
    if (operation.type === "insert") {
      if (!Number.isFinite(operation.value)) {
        throw new Error(`Insert operation ${index + 1} requires a finite number.`);
      }
      size += 1;
      continue;
    }
    if (operation.type !== "remove") {
      throw new Error(`Operation ${index + 1} must be insert <number> or remove.`);
    }
    if (size === 0) {
      throw new Error(`Operation ${index + 1} cannot remove from an empty heap.`);
    }
    size -= 1;
  }

  return operations;
}

/**
 * Restores min-heap order from one inserted position. The supplied dense,
 * finite numeric array is mutated and each actual [child, parent] swap is
 * returned in execution order. Equal values never swap.
 */
export function siftUpMinHeap(heap, startIndex = heap.length - 1) {
  validateMutableHeap(heap);
  if (heap.length === 0) {
    if (startIndex !== -1) throw new Error("An empty heap has no sift-up position.");
    return [];
  }
  assertHeapIndex(startIndex, heap.length, "Sift-up start index");

  const swaps = [];
  let childIndex = startIndex;
  while (childIndex > 0) {
    const parentIndex = Math.floor((childIndex - 1) / 2);
    if (!(heap[childIndex] < heap[parentIndex])) break;
    swap(heap, childIndex, parentIndex);
    swaps.push([childIndex, parentIndex]);
    childIndex = parentIndex;
  }
  return swaps;
}

/**
 * Restores min-heap order below one position. When children are equal, the
 * left child is selected; strict comparison prevents duplicate-value swaps.
 */
export function siftDownMinHeap(heap, startIndex = 0) {
  validateMutableHeap(heap);
  if (heap.length === 0) {
    if (startIndex !== 0) throw new Error("An empty heap has no sift-down position.");
    return [];
  }
  assertHeapIndex(startIndex, heap.length, "Sift-down start index");

  const swaps = [];
  let parentIndex = startIndex;
  while (true) {
    const leftIndex = parentIndex * 2 + 1;
    if (leftIndex >= heap.length) break;
    const rightIndex = leftIndex + 1;
    const smallerChildIndex = rightIndex < heap.length && heap[rightIndex] < heap[leftIndex]
      ? rightIndex
      : leftIndex;
    if (!(heap[smallerChildIndex] < heap[parentIndex])) break;
    swap(heap, parentIndex, smallerChildIndex);
    swaps.push([parentIndex, smallerChildIndex]);
    parentIndex = smallerChildIndex;
  }
  return swaps;
}

/**
 * Runs a bounded min-heap program without mutating its operations. Observable
 * removals retain their zero-based program index, and the final heap remains
 * in its compact complete-tree array representation.
 */
export function runHeapOperations(operations) {
  validateHeapOperations(operations);

  const heap = [];
  const removed = [];
  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    if (operation.type === "insert") {
      heap.push(operation.value);
      siftUpMinHeap(heap);
      continue;
    }

    const minimum = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      siftDownMinHeap(heap);
    }
    removed.push({ operationIndex, type: "remove", value: minimum });
  }

  return { removed, heap };
}

function parseOperation(token, index) {
  if (/^remove$/i.test(token)) return { type: "remove" };
  const match = token.match(/^insert\s+(.+)$/i);
  if (!match || !decimalNumberPattern.test(match[1].trim())) {
    throw new Error(`Operation ${index + 1} must be insert <number> or remove.`);
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    throw new Error(`Insert operation ${index + 1} requires a finite number.`);
  }
  return { type: "insert", value };
}

function validateMutableHeap(heap) {
  if (!Array.isArray(heap)) throw new Error("A heap must be an array.");
  for (let index = 0; index < heap.length; index += 1) {
    if (!Object.hasOwn(heap, index) || !Number.isFinite(heap[index])) {
      throw new Error("A heap must contain only dense finite numbers.");
    }
  }
}

function assertHeapIndex(index, length, label) {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error(`${label} must reference an existing heap position.`);
  }
}

function swap(heap, leftIndex, rightIndex) {
  [heap[leftIndex], heap[rightIndex]] = [heap[rightIndex], heap[leftIndex]];
}

function formatFiniteNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Only finite numbers can be formatted.");
  return Object.is(value, -0) ? "-0" : String(value);
}
