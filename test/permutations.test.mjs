import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPermutationValues,
  generatePermutations,
  maximumPermutationValues,
  parsePermutationValues,
  permutations,
  validatePermutationValues
} from "../backtracking/permutations.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildPermutationsTrace } from "../studio/src/permutations.mjs";
import { permutationsLesson } from "../studio/src/lessons/permutations.mjs";

test("generate-permutations returns input-order DFS permutations", () => {
  assert.deepEqual(generatePermutations([1, 2, 3]), [
    [1, 2, 3],
    [1, 3, 2],
    [2, 1, 3],
    [2, 3, 1],
    [3, 1, 2],
    [3, 2, 1]
  ]);
  assert.deepEqual(generatePermutations([2, 1]), [[2, 1], [1, 2]]);
  assert.deepEqual(generatePermutations([7]), [[7]]);
  assert.deepEqual(permutations([-2, 0]), [[-2, 0], [0, -2]]);
});

test("generate-permutations preserves input and owns every result", () => {
  const values = [1, 2, 3];
  const before = [...values];
  const result = generatePermutations(values);
  assert.deepEqual(values, before);
  assert.equal(new Set(result).size, result.length);
  result[0][0] = 99;
  assert.deepEqual(result[1], [1, 3, 2]);
  assert.deepEqual(values, before);
});

test("permutation validation rejects missing, empty, sparse, duplicate, nonfinite, and oversized input", () => {
  const sparse = [1, 2];
  delete sparse[0];
  for (const values of [
    undefined,
    null,
    [],
    sparse,
    [1, 1],
    [0, -0],
    [1, Number.NaN],
    [1, Infinity],
    Array.from({ length: maximumPermutationValues + 1 }, (_, index) => index)
  ]) {
    assert.throws(() => validatePermutationValues(values));
  }
});

test("permutation parser accepts finite numbers and round trips negative zero", () => {
  assert.deepEqual(parsePermutationValues(" -2.5, 0, 4 "), [-2.5, 0, 4]);
  assert.equal(formatPermutationValues([-2.5, -0, 4]), "-2.5, -0, 4");
  assert.deepEqual(parsePermutationValues(formatPermutationValues([-2.5, -0, 4])), [-2.5, -0, 4]);
  for (const source of [undefined, "", " ", "1,,2", "1, nope", "1, Infinity", "1, 1", "0, -0"]) {
    assert.throws(() => parsePermutationValues(source));
  }
});

test("permutation result count and membership agree with factorial", () => {
  for (const values of [[1], [1, 2], [1, 2, 3]]) {
    const result = generatePermutations(values);
    const expectedCount = values.reduce((product, _, index) => product * (index + 1), 1);
    assert.equal(result.length, expectedCount);
    assert.equal(new Set(result.map((permutation) => permutation.join(","))).size, expectedCount);
    for (const permutation of result) {
      assert.deepEqual([...permutation].sort((left, right) => left - right), [...values].sort((left, right) => left - right));
    }
  }
});

test("permutation trace explicitly chooses, recurses, records, and undoes", () => {
  const trace = buildPermutationsTrace([1, 2, 3]);
  for (const phase of ["initialize", "choose", "recurse", "record", "undo", "complete"]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  const firstRecords = trace.filter(({ phase }) => phase === "record").slice(0, 2);
  assert.deepEqual(firstRecords.map(({ path }) => path), [[1, 2, 3], [1, 3, 2]]);
  assert.equal(trace.filter(({ phase }) => phase === "record").length, 6);
  assert.deepEqual(trace.at(-1).path, []);
  assert.deepEqual(trace.at(-1).usedIndices, []);
  assert.deepEqual(trace.at(-1).result, generatePermutations([1, 2, 3]));
});

test("each undo restores exactly one choice before its sibling branch", () => {
  const trace = buildPermutationsTrace([1, 2]);
  for (const step of trace.filter(({ phase }) => phase === "undo")) {
    assert.equal(step.remainingIndices.includes(step.valueIndex), true);
    assert.equal(step.usedIndices.includes(step.valueIndex), false);
    assert.equal(step.views.choices.markers[step.valueIndex].kind, "available");
  }
  assert.deepEqual(trace.at(-1).results, [[1, 2], [2, 1]]);
});

test("permutation choice tree uses stable unique nodes and records every leaf", () => {
  const trace = buildPermutationsTrace([1, 2, 3]);
  const complete = trace.at(-1);
  assert.equal(complete.views.tree.nodes.length, 16);
  assert.equal(new Set(complete.views.tree.nodes.map(({ id }) => id)).size, 16);
  assert.equal(complete.views.tree.edges.length, 15);
  assert.equal(complete.views.tree.states.filter(({ kind }) => kind === "recorded").length, 6);
});

test("permutations lesson has exact L46 metadata and full deterministic ownership", () => {
  assert.equal(assertLesson(permutationsLesson), permutationsLesson);
  assert.equal(permutationsLesson.order, 46);
  assert.deepEqual(permutationsLesson.prerequisites, ["recursion/factorial"]);
  assert.deepEqual(permutationsLesson.patterns, ["backtracking", "choose-recurse-undo"]);
  const input = structuredClone(permutationsLesson.input.defaultValue);
  const trace = buildValidatedTrace(permutationsLesson, input);
  assert.equal(assertTrace(trace, permutationsLesson), trace);
  assert.deepEqual(input, permutationsLesson.input.defaultValue);

  for (const panel of ["choices", "path", "tree"]) {
    assert.equal(new Set(trace.map((step) => step.views[panel])).size, trace.length, panel);
  }
  for (const panel of ["choices", "path"]) {
    for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
      assert.equal(new Set(trace.map((step) => step.views[panel][property])).size, trace.length, `${panel}.${property}`);
    }
  }
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.views.tree[property])).size, trace.length, property);
  }
  assert.equal(new Set(trace.map(({ path }) => path)).size, trace.length);
  assert.equal(new Set(trace.map(({ results }) => results)).size, trace.length);
});

test("permutation trace rejects shared mutable renderer snapshots", () => {
  const trace = buildPermutationsTrace([1, 2]);
  trace[1].views.tree.nodes = trace[0].views.tree.nodes;
  assert.throws(() => assertTrace(trace, permutationsLesson), /nodes snapshot/);
});
