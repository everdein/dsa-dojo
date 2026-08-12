import test from "node:test";
import assert from "node:assert/strict";
import { connectedComponents } from "../graphs/connected-components.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { connectedComponentsLesson } from "../studio/src/lessons/connected-components.mjs";
import { buildConnectedComponentsTrace } from "../studio/src/connected-components.mjs";

test("connected-components preserves declared discovery order", () => {
  assert.deepEqual(connectedComponents(
    ["A", "B", "C", "D", "E"],
    [{ from: "A", to: "B" }, { from: "C", to: "D" }]
  ), [["A", "B"], ["C", "D"], ["E"]]);
  assert.deepEqual(connectedComponents(["A"], []), [["A"]]);
});

test("connected-components handles cycles and self loops without duplicate visits", () => {
  assert.deepEqual(connectedComponents(
    ["A", "B", "C"],
    [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "A" }]
  ), [["A", "B", "C"]]);
  assert.deepEqual(connectedComponents(["A"], [{ from: "A", to: "A" }]), [["A"]]);
});

test("connected-components rejects malformed graphs through the shared model", () => {
  assert.throws(() => connectedComponents([], []));
  assert.throws(() => connectedComponents(["A"], [{ from: "A", to: "B" }]));
  assert.throws(() => connectedComponents(["A", "a"], []));
});

test("connected-components trace launches one BFS per component", () => {
  const input = connectedComponentsLesson.input.defaultValue;
  const trace = buildConnectedComponentsTrace(input);
  assert.equal(trace.filter(({ phase }) => phase === "start-component").length, 3);
  assert.deepEqual(trace.at(-1).result, connectedComponents(input.nodes, input.edges));
  assert.ok(trace.some(({ phase }) => phase === "enqueue-neighbor"));
});

test("connected-components lesson satisfies deterministic graph and queue ownership", () => {
  const trace = buildValidatedTrace(connectedComponentsLesson, connectedComponentsLesson.input.defaultValue);
  for (const panel of ["graph", "queue"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const property of ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"]) {
    assert.equal(new Set(trace.map((step) => step.views.graph[property])).size, trace.length, property);
  }
});
