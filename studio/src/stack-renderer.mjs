import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const maximumStackItems = 16;

export const stackRendererAdapter = Object.freeze({
  id: "stack",
  matchesView: (view) => view?.structure === "stack" && Array.isArray(view?.items),
  assertView: assertStackView,
  assertSnapshotOwnership: assertStackSnapshotOwnership,
  projectView: projectStackView
});

export function assertStackView(view, stepIndex) {
  if (
    !view
    || view.structure !== "stack"
    || !Array.isArray(view.items)
    || !Array.isArray(view.activeItemIds)
    || !Array.isArray(view.changedItemIds)
    || !Array.isArray(view.annotations)
    || view.items.length > maximumStackItems
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid stack renderer view.`);
  }

  const itemIds = new Set();
  for (const item of view.items) {
    if (
      !item
      || !isSafeRendererToken(item.id)
      || itemIds.has(item.id)
      || !isStackValue(item.value)
      || (item.state !== undefined && !isSafeRendererToken(item.state))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid stack item.`);
    }
    itemIds.add(item.id);
  }

  assertUniqueKnownIds(view.activeItemIds, itemIds, stepIndex, "active item");
  assertUniqueKnownIds(view.changedItemIds, itemIds, stepIndex, "changed item");
  if (view.topItemId !== null && !itemIds.has(view.topItemId)) {
    throw new Error(`Trace step ${stepIndex} has an unknown stack top item.`);
  }
  const expectedTop = view.items.at(-1)?.id ?? null;
  if (view.topItemId !== expectedTop) {
    throw new Error(`Trace step ${stepIndex} stack top must reference the last item.`);
  }

  const annotationIds = new Set();
  for (const annotation of view.annotations) {
    if (
      !annotation
      || !itemIds.has(annotation.itemId)
      || annotationIds.has(annotation.itemId)
      || typeof annotation.label !== "string"
      || annotation.label.trim() === ""
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid stack annotation.`);
    }
    annotationIds.add(annotation.itemId);
  }
  return view;
}

export function assertStackSnapshotOwnership(trace) {
  assertOwnedArrays(trace, ["items", "activeItemIds", "changedItemIds", "annotations"], "stack renderer");
  assertOwnedObjects(trace, ["items", "annotations"], "stack renderer");
  return trace;
}

export function projectStackView(view) {
  const activeIds = new Set(view.activeItemIds);
  const changedIds = new Set(view.changedItemIds);
  const annotationById = new Map(view.annotations.map(({ itemId, label }) => [itemId, label]));
  const items = view.items.map((item, index) => {
    const valueText = typeof item.value === "number" ? formatNumber(item.value) : item.value;
    const isTop = item.id === view.topItemId;
    const isActive = activeIds.has(item.id);
    const isChanged = changedIds.has(item.id);
    const annotation = annotationById.get(item.id) ?? null;
    const details = [
      ...(isTop ? ["top"] : []),
      ...(isActive ? ["active"] : []),
      ...(isChanged ? ["changed this step"] : []),
      ...(item.state ? [item.state.replaceAll("-", " ")] : []),
      ...(annotation ? [annotation] : [])
    ];
    const description = `Stack position ${index}, value ${valueText}${details.length ? `, ${details.join(", ")}` : ""}`;
    return {
      ...item,
      index,
      valueText,
      isTop,
      isActive,
      isChanged,
      annotation,
      description,
      ariaLabel: description
    };
  });
  const description = items.length === 0
    ? "Stack is empty."
    : `Stack with ${items.length} ${items.length === 1 ? "item" : "items"}; top value ${items.at(-1).valueText}.`;
  return { items, description, ariaLabel: description };
}

function assertUniqueKnownIds(ids, knownIds, stepIndex, label) {
  if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) {
    throw new Error(`Trace step ${stepIndex} has an invalid stack ${label}.`);
  }
}

function isStackValue(value) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}
