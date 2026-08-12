import test from "node:test";
import assert from "node:assert/strict";
import {
  assertQueueSnapshotOwnership,
  assertQueueView,
  maximumQueueItems,
  projectQueueView,
  queueRendererAdapter
} from "../studio/src/queue-renderer.mjs";

test("queue renderer validates and projects front-to-back items", () => {
  const view = createView();
  assert.equal(assertQueueView(view, 0), view);
  const model = projectQueueView(view);
  assert.equal(model.items[0].isFront, true);
  assert.equal(model.items[1].isBack, true);
  assert.equal(model.items[0].isActive, true);
  assert.match(model.ariaLabel, /front 4, back 9/);
  assert.equal(queueRendererAdapter.projectView, projectQueueView);
});

test("queue renderer rejects malformed items, endpoints, references, and bounds", () => {
  const oversized = Array.from({ length: maximumQueueItems + 1 }, (_, index) => ({ id: `item-${index}`, value: index }));
  for (const view of [
    { ...createView(), structure: "stack" },
    { ...createView(), items: [{ id: "bad id", value: 1 }], frontItemId: "bad id", backItemId: "bad id", activeItemIds: [], changedItemIds: [], annotations: [] },
    { ...createView(), frontItemId: "item-1" },
    { ...createView(), backItemId: null },
    { ...createView(), activeItemIds: ["missing"] },
    { ...createView(), annotations: [{ itemId: "item-0", label: "" }] },
    { ...createView(), items: oversized, frontItemId: "item-0", backItemId: `item-${maximumQueueItems}`, activeItemIds: [], changedItemIds: [], annotations: [] }
  ]) {
    assert.throws(() => assertQueueView(view, 1));
  }
});

test("queue renderer enforces fresh rewind snapshots", () => {
  const trace = [{ view: createView() }, { view: createView() }];
  assert.equal(assertQueueSnapshotOwnership(trace), trace);
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    const shared = structuredClone(trace);
    shared[1].view[property] = shared[0].view[property];
    assert.throws(() => assertQueueSnapshotOwnership(shared), new RegExp(`${property} snapshot`));
  }
  const sharedItem = structuredClone(trace);
  sharedItem[1].view.items[0] = sharedItem[0].view.items[0];
  assert.throws(() => assertQueueSnapshotOwnership(sharedItem), /items objects/);
});

function createView() {
  return {
    structure: "queue",
    items: [{ id: "item-0", value: 4 }, { id: "item-1", value: 9 }],
    frontItemId: "item-0",
    backItemId: "item-1",
    activeItemIds: ["item-0"],
    changedItemIds: [],
    annotations: [{ itemId: "item-0", label: "next out" }]
  };
}
