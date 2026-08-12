import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const maximumQueueItems = 16;

export const queueRendererAdapter = Object.freeze({
  id: "queue",
  matchesView: (view) => view?.structure === "queue" && Array.isArray(view?.items),
  assertView: assertQueueView,
  assertSnapshotOwnership: assertQueueSnapshotOwnership,
  projectView: projectQueueView
});

export function assertQueueView(view, stepIndex) {
  if (
    !view
    || view.structure !== "queue"
    || !Array.isArray(view.items)
    || !Array.isArray(view.activeItemIds)
    || !Array.isArray(view.changedItemIds)
    || !Array.isArray(view.annotations)
    || view.items.length > maximumQueueItems
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid queue renderer view.`);
  }
  const ids = new Set();
  for (const item of view.items) {
    if (
      !item
      || !isSafeRendererToken(item.id)
      || ids.has(item.id)
      || !isQueueValue(item.value)
      || (item.state !== undefined && !isSafeRendererToken(item.state))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid queue item.`);
    }
    ids.add(item.id);
  }
  assertUniqueKnownIds(view.activeItemIds, ids, stepIndex, "active item");
  assertUniqueKnownIds(view.changedItemIds, ids, stepIndex, "changed item");
  const expectedFront = view.items[0]?.id ?? null;
  const expectedBack = view.items.at(-1)?.id ?? null;
  if (view.frontItemId !== expectedFront || view.backItemId !== expectedBack) {
    throw new Error(`Trace step ${stepIndex} queue endpoints must reference the first and last items.`);
  }
  const annotationIds = new Set();
  for (const annotation of view.annotations) {
    if (
      !annotation
      || !ids.has(annotation.itemId)
      || annotationIds.has(annotation.itemId)
      || typeof annotation.label !== "string"
      || annotation.label.trim() === ""
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid queue annotation.`);
    }
    annotationIds.add(annotation.itemId);
  }
  return view;
}

export function assertQueueSnapshotOwnership(trace) {
  assertOwnedArrays(trace, ["items", "activeItemIds", "changedItemIds", "annotations"], "queue renderer");
  assertOwnedObjects(trace, ["items", "annotations"], "queue renderer");
  return trace;
}

export function projectQueueView(view) {
  const activeIds = new Set(view.activeItemIds);
  const changedIds = new Set(view.changedItemIds);
  const annotationById = new Map(view.annotations.map(({ itemId, label }) => [itemId, label]));
  const items = view.items.map((item, index) => {
    const valueText = typeof item.value === "number" ? formatNumber(item.value) : item.value;
    const isFront = item.id === view.frontItemId;
    const isBack = item.id === view.backItemId;
    const isActive = activeIds.has(item.id);
    const isChanged = changedIds.has(item.id);
    const annotation = annotationById.get(item.id) ?? null;
    const details = [
      ...(isFront ? ["front"] : []),
      ...(isBack ? ["back"] : []),
      ...(isActive ? ["active"] : []),
      ...(isChanged ? ["changed this step"] : []),
      ...(item.state ? [item.state.replaceAll("-", " ")] : []),
      ...(annotation ? [annotation] : [])
    ];
    const description = `Queue position ${index}, value ${valueText}${details.length ? `, ${details.join(", ")}` : ""}`;
    return {
      ...item,
      index,
      valueText,
      isFront,
      isBack,
      isActive,
      isChanged,
      annotation,
      description,
      ariaLabel: description
    };
  });
  const description = items.length === 0
    ? "Queue is empty."
    : `Queue with ${items.length} ${items.length === 1 ? "item" : "items"}; front ${items[0].valueText}, back ${items.at(-1).valueText}.`;
  return { items, description, ariaLabel: description };
}

function assertUniqueKnownIds(ids, knownIds, stepIndex, label) {
  if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) {
    throw new Error(`Trace step ${stepIndex} has an invalid queue ${label}.`);
  }
}

function isQueueValue(value) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}
