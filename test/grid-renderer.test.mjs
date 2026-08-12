import test from "node:test";
import assert from "node:assert/strict";
import {
  assertGridSnapshotOwnership,
  assertGridView,
  gridRendererAdapter,
  maximumGridColumns,
  maximumGridRows,
  projectGridView
} from "../studio/src/grid-renderer.mjs";
import {
  getRendererAdapter,
  inferRendererAdapter
} from "../studio/src/renderer-registry.mjs";

test("grid renderer is registered and recognizes nested numeric values", () => {
  assert.equal(getRendererAdapter("grid"), gridRendererAdapter);
  assert.equal(inferRendererAdapter(createGridView()), gridRendererAdapter);
  assert.equal(gridRendererAdapter.assertView, assertGridView);
  assert.equal(gridRendererAdapter.assertSnapshotOwnership, assertGridSnapshotOwnership);
  assert.equal(gridRendererAdapter.projectView, projectGridView);
});

test("grid validation accepts bounded rectangular finite-number snapshots", () => {
  const view = createGridView();
  assert.equal(assertGridView(view, 0), view);
  assert.equal(
    assertGridView(createGridView({
      values: [[-0, Number.MIN_VALUE, Number.MAX_VALUE]],
      activeCells: [],
      changedCells: [],
      markers: [],
      annotations: []
    }), 1).values.length,
    1
  );
});

test("grid validation requires every explicit view array and a bounded rectangle", () => {
  for (const property of ["values", "activeCells", "changedCells", "markers", "annotations"]) {
    const view = createGridView();
    delete view[property];
    assert.throws(() => assertGridView(view, 2), /invalid grid renderer view/);
  }

  for (const values of [
    [],
    [[]],
    [[1, 2], [3]],
    [[1, Number.NaN]],
    [[1, Infinity]],
    [createSparseRow()],
    createSparseGrid()
  ]) {
    assert.throws(() => assertGridView(createGridView({ values }), 3), /grid|matrix/);
  }

  assert.throws(
    () => assertGridView(createGridView({
      values: Array.from({ length: maximumGridRows + 1 }, () => [1])
    }), 4),
    new RegExp(`1-${maximumGridRows} rows`)
  );
  assert.throws(
    () => assertGridView(createGridView({
      values: [Array.from({ length: maximumGridColumns + 1 }, () => 1)]
    }), 4),
    new RegExp(`1-${maximumGridColumns} columns`)
  );
});

test("grid validation requires unique in-bounds coordinates and safe metadata", () => {
  for (const [property, value, pattern] of [
    ["activeCells", [{ row: -1, column: 0 }], /invalid grid active cell/],
    ["changedCells", [{ row: 0, column: 3 }], /invalid grid changed cell/],
    ["activeCells", [{ row: 0, column: 0 }, { row: 0, column: 0 }], /duplicate grid active cell/],
    ["markers", [{ row: 0, column: 0, kind: "bad kind", label: "current" }], /invalid grid marker/],
    ["markers", [{ row: 0, column: 0, kind: "current", label: " " }], /invalid grid marker/],
    ["markers", [
      { row: 0, column: 0, kind: "current", label: "current" },
      { row: 0, column: 0, kind: "pivot", label: "pivot" }
    ], /duplicate grid marker/],
    ["annotations", [{ row: 0, column: 0, label: "" }], /invalid grid annotation/],
    ["annotations", [
      { row: 0, column: 0, label: "first" },
      { row: 0, column: 0, label: "second" }
    ], /duplicate grid annotation/]
  ]) {
    assert.throws(() => assertGridView(createGridView({ [property]: value }), 5), pattern);
  }
});

test("grid rewind snapshots own top-level arrays, rows, and nested coordinate objects", () => {
  const trace = [
    { view: createGridView() },
    { view: createGridView({ values: [[7, 8, 9], [10, 11, 12]] }) }
  ];
  assert.equal(assertGridSnapshotOwnership(trace), trace);

  for (const property of ["values", "activeCells", "changedCells", "markers", "annotations"]) {
    const shared = structuredClone(trace);
    shared[1].view[property] = shared[0].view[property];
    assert.throws(
      () => assertGridSnapshotOwnership(shared),
      new RegExp(`${property} snapshot`)
    );
  }

  const sharedRow = structuredClone(trace);
  sharedRow[1].view.values[0] = sharedRow[0].view.values[0];
  assert.throws(() => assertGridSnapshotOwnership(sharedRow), /row snapshots/);

  for (const property of ["activeCells", "changedCells", "markers", "annotations"]) {
    const sharedObject = structuredClone(trace);
    sharedObject[1].view[property][0] = sharedObject[0].view[property][0];
    assert.throws(
      () => assertGridSnapshotOwnership(sharedObject),
      new RegExp(`${property} objects`)
    );
  }
});

test("grid projection exposes row-shaped and flat accessible cell models", () => {
  const model = projectGridView(createGridView({
    values: [[-0, 2], [3, 4]],
    activeCells: [{ row: 0, column: 0 }],
    changedCells: [{ row: 0, column: 0 }],
    markers: [{ row: 0, column: 0, kind: "current", label: "current cell" }],
    annotations: [{ row: 0, column: 0, label: "visited" }]
  }));

  assert.deepEqual(model.dimensions, { rows: 2, columns: 2 });
  assert.equal(model.rowCount, 2);
  assert.equal(model.columnCount, 2);
  assert.equal(model.rows.length, 2);
  assert.equal(model.cells.length, 4);
  assert.match(model.description, /2 rows and 2 columns/);
  assert.equal(model.ariaLabel, model.description);
  assert.deepEqual(model.cells[0], {
    row: 0,
    column: 0,
    value: -0,
    formattedValue: "-0",
    active: true,
    changed: true,
    markers: [{ row: 0, column: 0, kind: "current", label: "current cell" }],
    annotations: [{ row: 0, column: 0, label: "visited" }],
    ariaLabel: "Row 0, column 0, value -0, active, changed this step, current cell, visited"
  });
  assert.equal(model.rows[1][1].ariaLabel, "Row 1, column 1, value 4");
});

function createGridView(overrides = {}) {
  return {
    values: [[1, 2, 3], [4, 5, 6]],
    activeCells: [{ row: 0, column: 1 }],
    changedCells: [{ row: 1, column: 2 }],
    markers: [{ row: 0, column: 1, kind: "current", label: "current cell" }],
    annotations: [{ row: 1, column: 2, label: "visited" }],
    ...overrides
  };
}

function createSparseRow() {
  const row = Array(2);
  row[0] = 1;
  return row;
}

function createSparseGrid() {
  const rows = Array(2);
  rows[0] = [1, 2];
  return rows;
}
