import {
  moveZeros,
  validateMoveZerosInput
} from "../../arrays/move-zeros.mjs";
import { formatNumber } from "./input.mjs";

export { moveZeros };

export function buildMoveZerosTrace(values) {
  validateMoveZerosInput(values);

  const working = [...values];
  const zeroCount = values.filter((value) => value === 0).length;
  const totalNonZeros = values.length - zeroCount;
  const trace = [];
  let write = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    working,
    readIndex: 0,
    targetIndex: 0,
    nextWriteIndex: 0,
    nonZeroCount: 0,
    totalNonZeros,
    zeroCount,
    readValue: working[0],
    moved: false,
    changed: false,
    narration: "Read inspects every value. Write marks where the next non-zero value belongs.",
    prompt: "Prediction: should a zero advance the write pointer?"
  }));

  for (let read = 0; read < working.length; read += 1) {
    const readValue = working[read];
    const targetIndex = write;

    if (readValue === 0) {
      trace.push(createStep({
        trace,
        phase: "skip-zero",
        codeSteps: ["inspect"],
        working,
        readIndex: read,
        targetIndex,
        nextWriteIndex: write,
        nonZeroCount: write,
        totalNonZeros,
        zeroCount,
        readValue,
        moved: false,
        changed: false,
        annotations: [{ index: read, label: "skip zero" }],
        narration: `Index ${read} contains zero. Read moves on, but write stays at index ${write}.`,
        prompt: "Why must write wait here for a non-zero value?"
      }));
      continue;
    }

    if (read === write) {
      write += 1;
      trace.push(createStep({
        trace,
        phase: "keep-value",
        codeSteps: ["inspect", "advance-write"],
        working,
        readIndex: read,
        targetIndex,
        nextWriteIndex: write,
        nonZeroCount: write,
        totalNonZeros,
        zeroCount,
        readValue,
        moved: false,
        changed: false,
        annotations: [{ index: targetIndex, label: "already placed" }],
        narration: `${formatNumber(readValue)} is already at the write target, so the stable prefix grows in place.`,
        prompt: "What invariant is true about every value before write?"
      }));
      continue;
    }

    working[read] = working[write];
    working[write] = readValue;
    write += 1;

    trace.push(createStep({
      trace,
      phase: "move-value",
      codeSteps: ["inspect", "swap", "advance-write"],
      working,
      readIndex: read,
      targetIndex,
      nextWriteIndex: write,
      nonZeroCount: write,
      totalNonZeros,
      zeroCount,
      readValue,
      moved: true,
      changed: true,
      changedIndices: [targetIndex, read],
      annotations: [
        { index: targetIndex, label: "placed" },
        { index: read, label: "zero moved back" }
      ],
      narration: `${formatNumber(readValue)} moves to index ${targetIndex}. The displaced zero moves behind the stable prefix.`,
      prompt: "Why does this preserve the order of the non-zero values?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      working,
      readIndex: null,
      targetIndex: null,
      nextWriteIndex: write,
      nonZeroCount: write,
      totalNonZeros,
      zeroCount,
      readValue: null,
      moved: false,
      changed: false,
      complete: true,
      narration: "Every non-zero value keeps its original relative order, and every zero is now at the end.",
      prompt: "Can you explain why write always marked the next non-zero destination?"
    }),
    result: [...working]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  working,
  readIndex,
  targetIndex,
  nextWriteIndex,
  nonZeroCount,
  totalNonZeros,
  zeroCount,
  readValue,
  moved,
  changed,
  narration,
  prompt,
  annotations = [],
  changedIndices = [],
  complete = false
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    readIndex,
    targetIndex,
    nextWriteIndex,
    nonZeroCount,
    totalNonZeros,
    zeroCount,
    readValue,
    moved,
    changed,
    view: {
      values: [...working],
      activeIndices: complete || readIndex === null ? [] : [readIndex],
      ranges: complete
        ? [{ start: 0, end: working.length - 1, kind: "settled", label: "final order" }]
        : stablePrefixRange(nonZeroCount),
      markers: complete ? [] : pointerMarkers(readIndex, nextWriteIndex, working.length),
      annotations: annotations.map((annotation) => ({ ...annotation })),
      changedIndices: [...changedIndices]
    },
    narration,
    prompt
  };
}

function stablePrefixRange(nonZeroCount) {
  return nonZeroCount > 0
    ? [{ start: 0, end: nonZeroCount - 1, kind: "settled", label: "stable prefix" }]
    : [];
}

function pointerMarkers(readIndex, writeIndex, length) {
  const markers = [];
  if (isValidIndex(readIndex, length)) {
    markers.push({ index: readIndex, kind: "read", label: "read" });
  }
  if (isValidIndex(writeIndex, length)) {
    markers.push({ index: writeIndex, kind: "write", label: "write" });
  }
  return markers;
}

function isValidIndex(index, length) {
  return Number.isInteger(index) && index >= 0 && index < length;
}
