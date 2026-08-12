import { formatNumber } from "./input.mjs";
import {
  assertOwnedArrays,
  assertOwnedObjects,
  isSafeRendererToken
} from "./renderer-validation.mjs";

export const maximumGridRows = 8;
export const maximumGridColumns = 8;

export const gridRendererAdapter = Object.freeze({
  id: "grid",
  matchesView: (view) => Array.isArray(view?.values)
    && view.values.length > 0
    && Array.from(view.values).every((row) => Array.isArray(row)),
  assertView: assertGridView,
  assertSnapshotOwnership: assertGridSnapshotOwnership,
  projectView: projectGridView
});

export function assertGridView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.values)
    || !Array.isArray(view.activeCells)
    || !Array.isArray(view.changedCells)
    || !Array.isArray(view.markers)
    || !Array.isArray(view.annotations)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid grid renderer view.`);
  }

  const rowCount = view.values.length;
  if (rowCount === 0 || rowCount > maximumGridRows) {
    throw new Error(`Trace step ${stepIndex} grid must contain 1-${maximumGridRows} rows.`);
  }
  const firstRow = view.values[0];
  if (!Array.isArray(firstRow)) {
    throw new Error(`Trace step ${stepIndex} has an invalid grid row.`);
  }
  const columnCount = firstRow.length;
  if (columnCount === 0 || columnCount > maximumGridColumns) {
    throw new Error(`Trace step ${stepIndex} grid must contain 1-${maximumGridColumns} columns.`);
  }
  for (const row of Array.from(view.values)) {
    if (
      !Array.isArray(row)
      || row.length !== columnCount
      || Array.from(row).some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`Trace step ${stepIndex} grid values must be a rectangular matrix of finite numbers.`);
    }
  }

  assertCoordinateList(view.activeCells, rowCount, columnCount, stepIndex, "active cell");
  assertCoordinateList(view.changedCells, rowCount, columnCount, stepIndex, "changed cell");
  assertCoordinateList(view.markers, rowCount, columnCount, stepIndex, "marker", (marker) => (
    isSafeRendererToken(marker.kind) && hasText(marker.label)
  ));
  assertCoordinateList(view.annotations, rowCount, columnCount, stepIndex, "annotation", (annotation) => (
    hasText(annotation.label)
  ));
  return view;
}

export function assertGridSnapshotOwnership(trace) {
  assertOwnedArrays(
    trace,
    ["values", "activeCells", "changedCells", "markers", "annotations"],
    "grid renderer"
  );
  assertOwnedObjects(
    trace,
    ["activeCells", "changedCells", "markers", "annotations"],
    "grid renderer"
  );

  const rows = trace.flatMap((step) => step.view.values);
  if (new Set(rows).size !== rows.length) {
    throw new Error("Every trace step must own its grid renderer row snapshots.");
  }
  return trace;
}

export function projectGridView(view) {
  const activeCoordinates = new Set(view.activeCells.map(coordinateKey));
  const changedCoordinates = new Set(view.changedCells.map(coordinateKey));
  const rows = view.values.map((values, row) => values.map((value, column) => {
    const key = coordinateKey({ row, column });
    const markers = view.markers.filter((marker) => coordinateKey(marker) === key);
    const annotations = view.annotations.filter((annotation) => coordinateKey(annotation) === key);
    const active = activeCoordinates.has(key);
    const changed = changedCoordinates.has(key);
    const descriptions = [
      ...(active ? ["active"] : []),
      ...(changed ? ["changed this step"] : []),
      ...markers.map((marker) => marker.label),
      ...annotations.map((annotation) => annotation.label)
    ];
    const formattedValue = formatNumber(value);

    return {
      row,
      column,
      value,
      formattedValue,
      active,
      changed,
      markers,
      annotations,
      ariaLabel: `Row ${row}, column ${column}, value ${formattedValue}${descriptions.length ? `, ${descriptions.join(", ")}` : ""}`
    };
  }));
  const rowCount = rows.length;
  const columnCount = rows[0].length;
  const description = `Numeric grid with ${rowCount} ${rowCount === 1 ? "row" : "rows"} and ${columnCount} ${columnCount === 1 ? "column" : "columns"}.`;

  return {
    rows,
    cells: rows.flat(),
    rowCount,
    columnCount,
    dimensions: { rows: rowCount, columns: columnCount },
    description,
    ariaLabel: description
  };
}

function assertCoordinateList(items, rowCount, columnCount, stepIndex, label, assertMetadata = null) {
  const coordinates = new Set();
  for (const item of items) {
    if (!isValidCoordinate(item, rowCount, columnCount) || (assertMetadata && !assertMetadata(item))) {
      throw new Error(`Trace step ${stepIndex} has an invalid grid ${label}.`);
    }
    const key = coordinateKey(item);
    if (coordinates.has(key)) {
      throw new Error(`Trace step ${stepIndex} has a duplicate grid ${label} coordinate.`);
    }
    coordinates.add(key);
  }
}

function isValidCoordinate(value, rowCount, columnCount) {
  return value
    && typeof value === "object"
    && Number.isInteger(value.row)
    && value.row >= 0
    && value.row < rowCount
    && Number.isInteger(value.column)
    && value.column >= 0
    && value.column < columnCount;
}

function coordinateKey({ row, column }) {
  return `${row}:${column}`;
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}
