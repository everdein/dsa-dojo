import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const arrayRendererAdapter = Object.freeze({
  id: "array",
  matchesView: (view) => Array.isArray(view?.values)
    && view.values.length > 0
    && view.values.every((value) => Number.isFinite(value)),
  assertView: assertArrayView,
  assertSnapshotOwnership: assertArraySnapshotOwnership,
  projectView: projectArrayView
});

export function assertArrayView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.values)
    || !Array.isArray(view.activeIndices)
    || !Array.isArray(view.ranges)
    || !Array.isArray(view.markers)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid array renderer view.`);
  }
  if (Array.from(view.values).some((value) => !Number.isFinite(value))) {
    throw new Error(`Trace step ${stepIndex} must contain finite renderer values.`);
  }
  if (view.annotations !== undefined && !Array.isArray(view.annotations)) {
    throw new Error(`Trace step ${stepIndex} has invalid annotations.`);
  }
  if (view.changedIndices !== undefined && !Array.isArray(view.changedIndices)) {
    throw new Error(`Trace step ${stepIndex} has invalid changed indices.`);
  }

  const maximumIndex = view.values.length - 1;
  for (const activeIndex of view.activeIndices) {
    assertArrayIndex(activeIndex, maximumIndex, stepIndex, "active index");
  }
  for (const marker of view.markers) {
    if (!isSafeRendererToken(marker.kind) || !marker.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid marker.`);
    }
    assertArrayIndex(marker.index, maximumIndex, stepIndex, "marker");
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
      throw new Error(`Trace step ${stepIndex} has an invalid range.`);
    }
  }
  for (const annotation of view.annotations ?? []) {
    if (!annotation.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid annotation.`);
    }
    assertArrayIndex(annotation.index, maximumIndex, stepIndex, "annotation");
  }
  for (const changedIndex of view.changedIndices ?? []) {
    assertArrayIndex(changedIndex, maximumIndex, stepIndex, "changed index");
  }
  return view;
}

export function assertArraySnapshotOwnership(trace) {
  assertOwnedArrays(
    trace,
    ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"],
    "array renderer"
  );
  assertOwnedObjects(trace, ["ranges", "markers", "annotations"], "array renderer");
  return trace;
}

/**
 * Converts a renderer-neutral trace view into stable cell models. The browser
 * adapter only turns these models into DOM nodes.
 */
export function projectArrayView(view) {
  return view.values.map((value, index) => {
    const ranges = view.ranges.filter((range) => index >= range.start && index <= range.end);
    const markers = view.markers.filter((marker) => marker.index === index);
    const annotations = (view.annotations ?? []).filter((annotation) => annotation.index === index);
    const active = view.activeIndices.includes(index);
    const changed = (view.changedIndices ?? []).includes(index);
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
      formattedValue: formatNumber(value),
      active,
      changed,
      ranges: ranges.map((range) => ({
        ...range,
        isStart: index === range.start,
        isEnd: index === range.end
      })),
      markers,
      annotations,
      ariaLabel: `Index ${index}, value ${formatNumber(value)}${descriptions.length ? `, ${descriptions.join(", ")}` : ""}`
    };
  });
}

function assertArrayIndex(index, maximumIndex, stepIndex, label) {
  if (!Number.isInteger(index) || index < 0 || index > maximumIndex) {
    throw new Error(`Trace step ${stepIndex} has an out-of-bounds ${label}.`);
  }
}
