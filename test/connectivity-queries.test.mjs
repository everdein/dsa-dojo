import test from "node:test";
import assert from "node:assert/strict";
import {
  connectivityQueries,
  formatConnectivityProgram,
  maximumConnectivityOperations,
  parseConnectivityProgram,
  runConnectivityQueries,
  validateConnectivityInput
} from "../disjoint-sets/connectivity-queries.mjs";
import {
  formatUnionFindNodes,
  parseUnionFindNodes,
  UnionFind
} from "../disjoint-sets/union-find.mjs";
import { buildConnectivityQueriesTrace } from "../studio/src/connectivity-queries.mjs";
import { connectivityQueriesLesson } from "../studio/src/lessons/connectivity-queries.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("connectivity parser extends the shared union language and round trips deterministically", () => {
  const nodes = parseUnionFindNodes(" A, B, C ");
  const operations = parseConnectivityProgram(
    " UNION A B , connected B C, union B C, CONNECTED A C ",
    nodes
  );
  assert.deepEqual(nodes, ["A", "B", "C"]);
  assert.deepEqual(operations, [
    { type: "union", left: "A", right: "B" },
    { type: "connected", left: "B", right: "C" },
    { type: "union", left: "B", right: "C" },
    { type: "connected", left: "A", right: "C" }
  ]);
  assert.equal(formatUnionFindNodes(nodes), "A, B, C");
  assert.equal(
    formatConnectivityProgram(operations, nodes),
    "union A B, connected B C, union B C, connected A C"
  );
  assert.deepEqual(
    parseConnectivityProgram(formatConnectivityProgram(operations, nodes), nodes),
    operations
  );
});

test("connectivity validation rejects malformed programs, unknown labels, sparse arrays, and bounds", () => {
  const nodes = ["A", "B"];
  for (const source of [
    undefined,
    null,
    "",
    " ",
    "find A",
    "connected A",
    "connected A B C",
    "union A",
    "union A B C",
    "connected A C",
    "union A C",
    "connected A B,"
  ]) {
    assert.throws(() => parseConnectivityProgram(source, nodes));
  }
  assert.throws(
    () => parseConnectivityProgram(
      Array(maximumConnectivityOperations + 1).fill("connected A B").join(", "),
      nodes
    ),
    /12 operations or fewer/
  );

  const sparse = [
    { type: "connected", left: "A", right: "B" },
    { type: "connected", left: "B", right: "A" }
  ];
  delete sparse[0];
  for (const [candidateNodes, operations] of [
    [[], [{ type: "connected", left: "A", right: "B" }]],
    [["A", "a"], [{ type: "connected", left: "A", right: "a" }]],
    [nodes, undefined],
    [nodes, []],
    [nodes, sparse],
    [nodes, [{ type: "connected", left: "A", right: "C" }]],
    [nodes, [{ type: "union", left: "A", right: "C" }]],
    [nodes, [{ type: "find", node: "A" }]],
    [nodes, Array(maximumConnectivityOperations + 1).fill({
      type: "connected",
      left: "A",
      right: "B"
    })]
  ]) {
    assert.throws(() => validateConnectivityInput(candidateNodes, operations));
  }
});

test("solver records dynamic false and true answers plus deterministic final state", () => {
  const nodes = ["A", "B", "C", "D"];
  const operations = parseConnectivityProgram(
    "connected A B, union A B, connected B A, union C D, connected B D, union B C, connected A D",
    nodes
  );
  const expected = {
    answers: [
      { operationIndex: 0, left: "A", right: "B", connected: false },
      { operationIndex: 2, left: "B", right: "A", connected: true },
      { operationIndex: 4, left: "B", right: "D", connected: false },
      { operationIndex: 6, left: "A", right: "D", connected: true }
    ],
    final: {
      parent: { A: "A", B: "A", C: "A", D: "A" },
      size: { A: 4, B: 1, C: 2, D: 1 },
      components: 1
    }
  };
  const original = structuredClone({ nodes, operations });
  assert.deepEqual(runConnectivityQueries(nodes, operations), expected);
  assert.deepEqual(connectivityQueries(nodes, operations), expected);
  assert.deepEqual({ nodes, operations }, original);
});

test("solver uses union-by-size even when the smaller component is the left operand", () => {
  const nodes = ["A", "B", "C", "D", "E"];
  const operations = parseConnectivityProgram(
    "union A B, union C D, union C E, union A C, connected B E",
    nodes
  );
  assert.deepEqual(runConnectivityQueries(nodes, operations), {
    answers: [
      { operationIndex: 4, left: "B", right: "E", connected: true }
    ],
    final: {
      parent: { A: "C", B: "C", C: "C", D: "C", E: "C" },
      size: { A: 2, B: 1, C: 5, D: 1, E: 1 },
      components: 1
    }
  });
});

test("connected queries compress traversed paths while preserving component membership", () => {
  const nodes = ["A", "B", "C", "D"];
  const operations = parseConnectivityProgram(
    "union A B, union C D, union A C, connected D B, connected D D",
    nodes
  );
  const beforeQuery = new UnionFind(nodes);
  beforeQuery.union("A", "B");
  beforeQuery.union("C", "D");
  beforeQuery.union("A", "C");
  assert.deepEqual(beforeQuery.inspectFind("D").path, ["D", "C", "A"]);

  const result = runConnectivityQueries(nodes, operations);
  assert.deepEqual(result.answers, [
    { operationIndex: 3, left: "D", right: "B", connected: true },
    { operationIndex: 4, left: "D", right: "D", connected: true }
  ]);
  assert.equal(result.final.parent.D, "A");
  assert.equal(result.final.components, 1);
});

test("Connectivity Queries lesson uses exact L38 metadata and shared node parsing", () => {
  assert.equal(assertLesson(connectivityQueriesLesson), connectivityQueriesLesson);
  assert.equal(connectivityQueriesLesson.id, "disjoint-sets/connectivity-queries");
  assert.equal(connectivityQueriesLesson.order, 38);
  assert.deepEqual(connectivityQueriesLesson.prerequisites, [
    "disjoint-sets/union-find-fundamentals"
  ]);
  assert.deepEqual(connectivityQueriesLesson.patterns, [
    "union-find",
    "path-compression",
    "union-by-size",
    "connectivity-query"
  ]);
  assert.equal(Object.hasOwn(connectivityQueriesLesson, "renderer"), false);
  assert.deepEqual(connectivityQueriesLesson.views, [
    { id: "forest", renderer: "graph", heading: "Directed parent forest" },
    { id: "parents", renderer: "lookup", heading: "Parent table" }
  ]);

  const parsed = connectivityQueriesLesson.input.parse({
    nodes: "A, B, C",
    operations: "union A B, connected B C"
  });
  assert.deepEqual(parsed, {
    nodes: ["A", "B", "C"],
    operations: [
      { type: "union", left: "A", right: "B" },
      { type: "connected", left: "B", right: "C" }
    ]
  });
  assert.deepEqual(
    connectivityQueriesLesson.input.parse(connectivityQueriesLesson.input.serialize(parsed)),
    parsed
  );
});

test("trace shows parent paths before and after compression plus both query results", () => {
  const input = {
    nodes: ["A", "B", "C", "D", "E"],
    operations: [
      { type: "union", left: "A", right: "B" },
      { type: "union", left: "C", right: "D" },
      { type: "union", left: "A", right: "C" },
      { type: "connected", left: "D", right: "B" },
      { type: "connected", left: "D", right: "E" }
    ]
  };
  const trace = buildValidatedTrace(connectivityQueriesLesson, input);
  const before = trace.find((step) => (
    step.phase === "find-path"
    && step.operationIndex === 3
    && step.operand === "left"
  ));
  const compression = trace.find((step) => (
    step.phase === "compress-path"
    && step.operationIndex === 3
    && step.operand === "left"
  ));
  const after = trace.find((step) => (
    step.phase === "find-path"
    && step.operationIndex === 4
    && step.operand === "left"
  ));

  assert.deepEqual(before.path, ["D", "C", "A"]);
  assert.equal(before.parent.D, "C");
  assert.deepEqual(before.views.forest.activeEdgeIds, ["parent-edge-3", "parent-edge-2"]);
  assert.deepEqual(compression.compressedNodes, ["D"]);
  assert.equal(compression.parent.D, "A");
  assert.equal(
    compression.views.parents.entries.find(({ key }) => key === "D").value,
    "A"
  );
  assert.deepEqual(after.path, ["D", "A"]);

  const queryResults = trace.filter(({ phase }) => phase === "connectivity-result");
  assert.deepEqual(queryResults.map(({ connected }) => connected), [true, false]);
  assert.deepEqual(queryResults.map(({ answerCount }) => answerCount), [1, 2]);
  assert.deepEqual(trace.at(-1).result, runConnectivityQueries(input.nodes, input.operations));
});

test("trace makes equal ties, smaller-left attachment, and redundant unions explicit", () => {
  const trace = buildConnectivityQueriesTrace({
    nodes: ["A", "B", "C", "D", "E"],
    operations: parseConnectivityProgram(
      "union A B, union C D, union C E, union A C, union B D",
      ["A", "B", "C", "D", "E"]
    )
  });
  const unions = trace.filter(({ phase }) => phase === "union-by-size");
  assert.equal(unions[0].winningRoot, "A");
  assert.equal(unions[0].attachedRoot, "B");
  const smallerLeft = unions.find(({ operationIndex }) => operationIndex === 3);
  assert.equal(smallerLeft.leftRoot, "A");
  assert.equal(smallerLeft.rightRoot, "C");
  assert.equal(smallerLeft.winningRoot, "C");
  assert.equal(smallerLeft.attachedRoot, "A");
  assert.equal(smallerLeft.winningSize, 5);
  const redundant = trace.find(({ phase }) => phase === "already-connected");
  assert.equal(redundant.operationIndex, 4);
  assert.equal(redundant.components, 1);
  assert.deepEqual(redundant.size, { A: 2, B: 1, C: 5, D: 1, E: 1 });
});

test("Connectivity Queries trace is deterministic, immutable, and deeply owns all snapshots", () => {
  const input = structuredClone(connectivityQueriesLesson.input.defaultValue);
  const original = structuredClone(input);
  const first = buildConnectivityQueriesTrace(input);
  const second = buildConnectivityQueriesTrace(structuredClone(input));

  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.equal(assertTrace(first, connectivityQueriesLesson), first);
  assert.deepEqual(first.at(-1).result, runConnectivityQueries(input.nodes, input.operations));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
  });

  for (const [panelId, properties, objectProperties] of [
    ["forest", ["nodes", "edges", "activeNodeIds", "activeEdgeIds", "changedNodeIds", "states", "annotations"], ["nodes", "edges", "states", "annotations"]],
    ["parents", ["entries", "activeKeys", "annotations", "resultKeys"], ["entries", "annotations"]]
  ]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length, panelId);
    for (const property of properties) {
      assert.equal(
        new Set(first.map((step) => step.views[panelId][property])).size,
        first.length,
        `${panelId}.${property}`
      );
    }
    for (const property of objectProperties) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property} objects`);
    }
  }

  for (const property of ["path", "compressedNodes", "answers"]) {
    assert.equal(new Set(first.map((step) => step[property])).size, first.length, property);
  }
  for (const property of ["parent", "size", "operation"]) {
    const objects = first.map((step) => step[property]).filter(Boolean);
    assert.equal(new Set(objects).size, objects.length, property);
  }
  const answerObjects = first.flatMap((step) => step.answers);
  assert.equal(new Set(answerObjects).size, answerObjects.length, "answer objects");
});
