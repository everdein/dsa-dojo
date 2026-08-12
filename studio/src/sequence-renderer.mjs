import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const sequenceRendererAdapter = Object.freeze({
  id: "sequence",
  matchesView: (view) => Array.isArray(view?.values)
    && view.values.every((value) => typeof value === "string"),
  assertView: assertSequenceView,
  assertSnapshotOwnership: assertSequenceSnapshotOwnership,
  projectView: projectSequenceView
});

export function assertSequenceView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.values)
    || !Array.isArray(view.activeIndices)
    || !Array.isArray(view.ranges)
    || !Array.isArray(view.markers)
    || !Array.isArray(view.annotations)
    || !Array.isArray(view.changedIndices)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid sequence renderer view.`);
  }
  if (
    view.values.length === 0
    || view.values.some((value) => typeof value !== "string" || Array.from(value).length !== 1)
  ) {
    throw new Error(`Trace step ${stepIndex} must contain one Unicode character per sequence cell.`);
  }

  const maximumIndex = view.values.length - 1;
  for (const activeIndex of view.activeIndices) {
    assertSequenceIndex(activeIndex, maximumIndex, stepIndex, "active index");
  }
  for (const marker of view.markers) {
    if (!isSafeRendererToken(marker.kind) || !marker.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid sequence marker.`);
    }
    assertSequenceIndex(marker.index, maximumIndex, stepIndex, "marker");
  }
  for (const range of view.ranges) {
    if (
      !isSafeRendererToken(range.kind)
      || !range.label
      || !Number.isInteger(range.start)
      || !Number.isInteger(range.end)
      || range.start < 0
      || range.start > range.end
      || range.end > maximumIndex
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid sequence range.`);
    }
  }
  for (const annotation of view.annotations) {
    if (!annotation.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid sequence annotation.`);
    }
    assertSequenceIndex(annotation.index, maximumIndex, stepIndex, "annotation");
  }
  for (const changedIndex of view.changedIndices) {
    assertSequenceIndex(changedIndex, maximumIndex, stepIndex, "changed index");
  }
  return view;
}

export function assertSequenceSnapshotOwnership(trace) {
  assertOwnedArrays(
    trace,
    ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"],
    "sequence renderer"
  );
  assertOwnedObjects(trace, ["ranges", "markers", "annotations"], "sequence renderer");
  return trace;
}

export function projectSequenceView(view) {
  return view.values.map((value, index) => {
    const ranges = view.ranges.filter((range) => index >= range.start && index <= range.end);
    const markers = view.markers.filter((marker) => marker.index === index);
    const annotations = view.annotations.filter((annotation) => annotation.index === index);
    const active = view.activeIndices.includes(index);
    const changed = view.changedIndices.includes(index);
    const descriptions = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...ranges.map((range) => range.label),
      ...markers.map((marker) => marker.label),
      ...annotations.map((annotation) => annotation.label)
    ];

    return {
      index,
      value,
      formattedValue: displayCharacter(value),
      active,
      changed,
      ranges: ranges.map((range) => ({
        ...range,
        isStart: index === range.start,
        isEnd: index === range.end
      })),
      markers,
      annotations,
      ariaLabel: `Character ${index}, ${describeCharacter(value)}${descriptions.length ? `, ${descriptions.join(", ")}` : ""}`
    };
  });
}

function displayCharacter(value) {
  if (value === " ") return "·";
  if (value === "\t") return "⇥";
  if (value === "\n") return "↵";
  return value;
}

function describeCharacter(value) {
  if (value === " ") return "space";
  if (value === "\t") return "tab";
  if (value === "\n") return "line break";
  return `value ${value}`;
}

function assertSequenceIndex(index, maximumIndex, stepIndex, label) {
  if (!Number.isInteger(index) || index < 0 || index > maximumIndex) {
    throw new Error(`Trace step ${stepIndex} has an out-of-bounds sequence ${label}.`);
  }
}
