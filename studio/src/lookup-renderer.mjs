import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const lookupRendererAdapter = Object.freeze({
  id: "lookup",
  matchesView: (view) => Array.isArray(view?.entries),
  assertView: assertLookupView,
  assertSnapshotOwnership: assertLookupSnapshotOwnership,
  projectView: projectLookupView
});

export function assertLookupView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.entries)
    || !Array.isArray(view.activeKeys)
    || !Array.isArray(view.annotations)
    || !Array.isArray(view.resultKeys)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid lookup renderer view.`);
  }

  const entryKeys = new Set();
  for (const entry of view.entries) {
    if (
      !entry
      || typeof entry.key !== "string"
      || entry.key.length === 0
      || entryKeys.has(entry.key)
      || !isLookupValue(entry.value)
      || (entry.state !== undefined && !isSafeRendererToken(entry.state))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid lookup entry.`);
    }
    entryKeys.add(entry.key);
  }

  assertUniqueKnownKeys(view.activeKeys, entryKeys, stepIndex, "active key");
  assertUniqueKnownKeys(view.resultKeys, entryKeys, stepIndex, "result key");

  const annotationKeys = new Set();
  for (const annotation of view.annotations) {
    if (
      !annotation
      || typeof annotation.key !== "string"
      || !entryKeys.has(annotation.key)
      || annotationKeys.has(annotation.key)
      || typeof annotation.label !== "string"
      || annotation.label.trim() === ""
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid lookup annotation.`);
    }
    annotationKeys.add(annotation.key);
  }
  return view;
}

export function assertLookupSnapshotOwnership(trace) {
  assertOwnedArrays(
    trace,
    ["entries", "activeKeys", "annotations", "resultKeys"],
    "lookup renderer"
  );
  assertOwnedObjects(trace, ["entries", "annotations"], "lookup renderer");
  return trace;
}

export function projectLookupView(view) {
  const activeKeys = new Set(view.activeKeys);
  const resultKeys = new Set(view.resultKeys);
  const annotationByKey = new Map(
    view.annotations.map((annotation) => [annotation.key, annotation.label])
  );

  const entries = view.entries.map((entry) => {
    const valueText = formatLookupValue(entry.value);
    const isActive = activeKeys.has(entry.key);
    const isResult = resultKeys.has(entry.key);
    const annotation = annotationByKey.get(entry.key) ?? null;
    const details = [
      ...(entry.state ? [entry.state.replaceAll("-", " ")] : []),
      ...(isActive ? ["active"] : []),
      ...(isResult ? ["part of result"] : []),
      ...(annotation ? [annotation] : [])
    ];
    const description = `Key ${entry.key}, value ${valueText}${details.length ? `, ${details.join(", ")}` : ""}`;

    return {
      ...entry,
      valueText,
      isActive,
      isResult,
      annotation,
      description,
      ariaLabel: description
    };
  });

  return {
    entries,
    description: entries.length === 0
      ? "Lookup is empty."
      : `Lookup with ${entries.length} ${entries.length === 1 ? "entry" : "entries"}. ${entries.map(({ description }) => description).join(". ")}`,
    ariaLabel: entries.length === 0
      ? "Lookup is empty."
      : `Lookup with ${entries.length} ${entries.length === 1 ? "entry" : "entries"}. ${entries.map(({ description }) => description).join(". ")}`
  };
}

function assertUniqueKnownKeys(keys, entryKeys, stepIndex, label) {
  if (new Set(keys).size !== keys.length) {
    throw new Error(`Trace step ${stepIndex} has a duplicate lookup ${label}.`);
  }
  for (const key of keys) {
    if (typeof key !== "string" || !entryKeys.has(key)) {
      throw new Error(`Trace step ${stepIndex} has an unknown lookup ${label}.`);
    }
  }
}

function isLookupValue(value) {
  return (typeof value === "string") || (typeof value === "number" && Number.isFinite(value));
}

function formatLookupValue(value) {
  return typeof value === "number" ? formatNumber(value) : value;
}
