import test from "node:test";
import assert from "node:assert/strict";
import {
  assertStackSnapshotOwnership,
  assertStackView,
  maximumStackItems,
  projectStackView,
  stackRendererAdapter
} from "../studio/src/stack-renderer.mjs";

test("stack renderer validates and projects bottom-to-top items", () => {
  const view = createView();
  assert.equal(assertStackView(view, 0), view);
  const model = projectStackView(view);
  assert.equal(model.items[1].isTop, true);
  assert.equal(model.items[1].isActive, true);
  assert.equal(model.items[1].isChanged, true);
  assert.equal(model.items[1].annotation, "just pushed");
  assert.match(model.ariaLabel, /top value \)/);
  assert.equal(stackRendererAdapter.projectView, projectStackView);
});

test("stack renderer rejects malformed items, topology, references, and bounds", () => {
  const invalidViews = [
    { ...createView(), structure: "queue" },
    { ...createView(), items: [{ id: "bad id", value: "(" }] },
    { ...createView(), items: [{ id: "item-0", value: Infinity }], topItemId: "item-0", activeItemIds: [], changedItemIds: [], annotations: [] },
    { ...createView(), topItemId: "item-0" },
    { ...createView(), activeItemIds: ["missing"] },
    { ...createView(), changedItemIds: ["item-1", "item-1"] },
    { ...createView(), annotations: [{ itemId: "missing", label: "bad" }] },
    { ...createView(), items: Array.from({ length: maximumStackItems + 1 }, (_, index) => ({ id: `item-${index}`, value: index })), topItemId: `item-${maximumStackItems}` }
  ];
  for (const view of invalidViews) assert.throws(() => assertStackView(view, 1));
});

test("stack renderer enforces fresh rewind snapshots", () => {
  const trace = [{ view: createView() }, { view: createView() }];
  assert.equal(assertStackSnapshotOwnership(trace), trace);
  for (const property of ["items", "activeItemIds", "changedItemIds", "annotations"]) {
    const shared = structuredClone(trace);
    shared[1].view[property] = shared[0].view[property];
    assert.throws(() => assertStackSnapshotOwnership(shared), new RegExp(`${property} snapshot`));
  }
  const sharedItem = structuredClone(trace);
  sharedItem[1].view.items[0] = sharedItem[0].view.items[0];
  assert.throws(() => assertStackSnapshotOwnership(sharedItem), /items objects/);
});

function createView() {
  return {
    structure: "stack",
    items: [
      { id: "item-0", value: "[", state: "waiting" },
      { id: "item-1", value: ")", state: "mismatch" }
    ],
    topItemId: "item-1",
    activeItemIds: ["item-1"],
    changedItemIds: ["item-1"],
    annotations: [{ itemId: "item-1", label: "just pushed" }]
  };
}
