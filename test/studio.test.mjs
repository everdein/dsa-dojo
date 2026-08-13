import test from "node:test";
import assert from "node:assert/strict";
import { findLargest } from "../arrays/find-largest.mjs";
import { moveZeros } from "../arrays/move-zeros.mjs";
import { reverseArray } from "../arrays/reverse-array.mjs";
import { maxWindowSum } from "../arrays/sliding-window.mjs";
import { hasCycle } from "../linked-lists/detect-cycle.mjs";
import {
  createLinkedList,
  linkedListToValues
} from "../linked-lists/model.mjs";
import { reverseLinkedList } from "../linked-lists/reverse-linked-list.mjs";
import { traverseLinkedList } from "../linked-lists/traverse-linked-list.mjs";
import { projectArrayView } from "../studio/src/array-renderer.mjs";
import { formatNumber, parseNumberList, parsePositiveInteger } from "../studio/src/input.mjs";
import { projectLinkedListView } from "../studio/src/linked-list-renderer.mjs";
import {
  assertLesson,
  assertTrace,
  buildTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { getLesson, listLessons } from "../studio/src/lessons/index.mjs";
import { lessonHash, readLessonIdFromHash } from "../studio/src/navigation.mjs";
import {
  isPipEmotion,
  mountPips,
  normalizePipState,
  observePipVisibility,
  pipEmotionForLearning,
  pipEmotionLabel,
  pipSenseiLine,
  pipStateForPlayer
} from "../studio/src/pip.mjs";
import { createPlayerState, playerReducer } from "../studio/src/player.mjs";
import {
  controlValueToPlaybackDelay,
  playbackDelayToControlValue,
  playbackSpeedLabel
} from "../studio/src/speed.mjs";
import { resolveRequest } from "../studio/server.mjs";

const lessons = listLessons();

test("registry exposes fifty-five unique, ordered lessons across twenty topics", () => {
  assert.deepEqual(lessons.map((lesson) => lesson.id), [
    "arrays/find-largest",
    "arrays/sliding-window",
    "arrays/reverse-array",
    "arrays/move-zeros",
    "linked-lists/traverse-linked-list",
    "linked-lists/reverse-linked-list",
    "linked-lists/detect-cycle",
    "strings/valid-palindrome",
    "arrays/pair-sum",
    "arrays/frequency-count",
    "strings/first-non-repeating",
    "matrices/traverse-matrix",
    "matrices/rotate-matrix",
    "hash-maps-and-sets/find-duplicates",
    "arrays/longest-consecutive",
    "hash-maps-and-sets/group-anagrams",
    "stacks/valid-parentheses",
    "stacks/min-stack",
    "stacks/evaluate-postfix",
    "queues/queue-operations",
    "queues/sliding-window-maximum",
    "patterns/prefix-sum-range-queries",
    "patterns/merge-intervals",
    "searching/binary-search",
    "trees/inorder-traversal",
    "trees/level-order-traversal",
    "trees/validate-bst",
    "tries/trie-insert-search",
    "tries/prefix-count",
    "heaps-and-priority-queues/heap-operations",
    "heaps-and-priority-queues/k-largest",
    "heaps-and-priority-queues/top-k-frequent",
    "heaps-and-priority-queues/merge-k-sorted-lists",
    "graphs/connected-components",
    "graphs/unweighted-shortest-path",
    "graphs/detect-cycle",
    "disjoint-sets/union-find-fundamentals",
    "disjoint-sets/connectivity-queries",
    "disjoint-sets/count-components",
    "sorting/bubble-sort",
    "sorting/insertion-sort",
    "recursion/factorial",
    "recursion/recursive-fibonacci",
    "sorting/merge-sort",
    "sorting/quick-sort",
    "backtracking/permutations",
    "backtracking/n-queens",
    "greedy/activity-selection",
    "greedy/coin-change-counterexample",
    "dynamic-programming/memoized-fibonacci",
    "dynamic-programming/climbing-stairs",
    "dynamic-programming/minimum-coins",
    "bit-manipulation/parity",
    "bit-manipulation/count-set-bits",
    "bit-manipulation/single-number"
  ]);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.deepEqual([...new Set(lessons.map((lesson) => lesson.topic))], [
    "Arrays",
    "Linked Lists",
    "Strings",
    "Matrices",
    "Hash Maps and Sets",
    "Stacks",
    "Queues",
    "Patterns",
    "Searching",
    "Trees",
    "Tries",
    "Heaps and Priority Queues",
    "Graphs",
    "Disjoint Sets",
    "Sorting",
    "Recursion",
    "Backtracking",
    "Greedy",
    "Dynamic Programming",
    "Bit Manipulation"
  ]);
  assert.equal(getLesson("arrays/sliding-window").order, 2);
  assert.equal(getLesson("arrays/move-zeros").order, 4);
  assert.equal(getLesson("linked-lists/detect-cycle").order, 7);
  assert.equal(getLesson("strings/valid-palindrome").order, 8);
  assert.equal(getLesson("arrays/pair-sum").order, 9);
  assert.equal(getLesson("arrays/frequency-count").order, 10);
  assert.equal(getLesson("strings/first-non-repeating").order, 11);
  assert.equal(getLesson("matrices/traverse-matrix").order, 12);
  assert.equal(getLesson("matrices/rotate-matrix").order, 13);
  assert.equal(getLesson("hash-maps-and-sets/find-duplicates").order, 14);
  assert.equal(getLesson("arrays/longest-consecutive").order, 15);
  assert.equal(getLesson("hash-maps-and-sets/group-anagrams").order, 16);
  assert.equal(getLesson("stacks/valid-parentheses").order, 17);
  assert.equal(getLesson("stacks/min-stack").order, 18);
  assert.equal(getLesson("stacks/evaluate-postfix").order, 19);
  assert.equal(getLesson("queues/queue-operations").order, 20);
  assert.equal(getLesson("queues/sliding-window-maximum").order, 21);
  assert.equal(getLesson("patterns/prefix-sum-range-queries").order, 22);
  assert.equal(getLesson("patterns/merge-intervals").order, 23);
  assert.equal(getLesson("searching/binary-search").order, 24);
  assert.equal(getLesson("trees/inorder-traversal").order, 25);
  assert.equal(getLesson("trees/level-order-traversal").order, 26);
  assert.equal(getLesson("trees/validate-bst").order, 27);
  assert.equal(getLesson("tries/trie-insert-search").order, 28);
  assert.equal(getLesson("tries/prefix-count").order, 29);
  assert.equal(getLesson("heaps-and-priority-queues/heap-operations").order, 30);
  assert.equal(getLesson("heaps-and-priority-queues/k-largest").order, 31);
  assert.equal(getLesson("heaps-and-priority-queues/top-k-frequent").order, 32);
  assert.equal(getLesson("heaps-and-priority-queues/merge-k-sorted-lists").order, 33);
  assert.equal(getLesson("graphs/connected-components").order, 34);
  assert.equal(getLesson("graphs/unweighted-shortest-path").order, 35);
  assert.equal(getLesson("graphs/detect-cycle").order, 36);
  assert.equal(getLesson("disjoint-sets/union-find-fundamentals").order, 37);
  assert.equal(getLesson("disjoint-sets/connectivity-queries").order, 38);
  assert.equal(getLesson("disjoint-sets/count-components").order, 39);
  assert.equal(getLesson("sorting/bubble-sort").order, 40);
  assert.equal(getLesson("sorting/insertion-sort").order, 41);
  assert.equal(getLesson("recursion/factorial").order, 42);
  assert.equal(getLesson("recursion/recursive-fibonacci").order, 43);
  assert.equal(getLesson("sorting/merge-sort").order, 44);
  assert.equal(getLesson("sorting/quick-sort").order, 45);
  assert.equal(getLesson("backtracking/permutations").order, 46);
  assert.equal(getLesson("backtracking/n-queens").order, 47);
  assert.equal(getLesson("greedy/activity-selection").order, 48);
  assert.equal(getLesson("greedy/coin-change-counterexample").order, 49);
  assert.equal(getLesson("dynamic-programming/memoized-fibonacci").order, 50);
  assert.equal(getLesson("dynamic-programming/climbing-stairs").order, 51);
  assert.equal(getLesson("dynamic-programming/minimum-coins").order, 52);
  assert.equal(getLesson("bit-manipulation/parity").order, 53);
  assert.equal(getLesson("bit-manipulation/count-set-bits").order, 54);
  assert.equal(getLesson("bit-manipulation/single-number").order, 55);
  assert.throws(() => getLesson("missing"));
});

test("every registered lesson satisfies the complete contract", () => {
  for (const lesson of lessons) assert.equal(assertLesson(lesson), lesson);
});

test("lesson contract rejects metadata and input definitions the browser cannot render", () => {
  const lesson = getLesson("arrays/find-largest");
  assert.throws(() => assertLesson({ ...lesson, catalogLabel: "" }));
  assert.throws(() => assertLesson({
    ...lesson,
    input: { ...lesson.input, parse: null }
  }));
  assert.throws(() => assertLesson({
    ...lesson,
    legend: []
  }));
  assert.throws(() => assertLesson({
    ...lesson,
    legend: [{ kind: "unsafe kind", label: "unsafe" }]
  }));
  assert.throws(() => assertLesson({
    ...lesson,
    code: { ...lesson.code, sourcePath: "../arrays/find-largest.mjs" }
  }), /sourcePath/);
  assert.throws(() => assertLesson({
    ...lesson,
    code: { ...lesson.code, sourcePath: "arrays/sliding-window.mjs" }
  }), /filename/);
  assert.throws(() => assertLesson({
    ...lesson,
    code: {
      ...lesson.code,
      lines: [{ ...lesson.code.lines[0], number: 0 }]
    }
  }), /source line/);
});

test("trace contract rejects unsafe mutable renderer state", () => {
  const lesson = getLesson("arrays/reverse-array");

  const badAnnotation = lesson.buildTrace({ values: [1, 2, 3] });
  badAnnotation[0].view.annotations = [{ index: 9, label: "outside" }];
  assert.throws(() => assertTrace(badAnnotation, lesson), /annotation/);

  const badChange = lesson.buildTrace({ values: [1, 2, 3] });
  badChange[0].view.changedIndices = [-1];
  assert.throws(() => assertTrace(badChange, lesson), /changed index/);

  const sharedSnapshot = lesson.buildTrace({ values: [1, 2, 3] });
  sharedSnapshot[1].view.values = sharedSnapshot[0].view.values;
  assert.throws(() => assertTrace(sharedSnapshot, lesson), /array renderer values snapshot/);

  const missingPrompt = lesson.buildTrace({ values: [1, 2, 3] });
  delete missingPrompt[0].prompt;
  assert.throws(() => assertTrace(missingPrompt, lesson), /prompt/);

  const unsafeKind = lesson.buildTrace({ values: [1, 2, 3] });
  unsafeKind[0].view.markers = [{ index: 0, kind: "bad kind", label: "bad" }];
  assert.throws(() => assertTrace(unsafeKind, lesson), /marker/);

  const unknownPipCue = lesson.buildTrace({ values: [1, 2, 3] });
  unknownPipCue[0].pipCue = "confounded";
  assert.throws(() => assertTrace(unknownPipCue, lesson), /unknown Pip emotion cue/);
});

test("an explicitly selected array renderer can represent an empty derived structure", () => {
  const lesson = getLesson("arrays/find-largest");
  const trace = lesson.buildTrace({ values: [1] });
  trace[0].view = {
    values: [],
    activeIndices: [],
    ranges: [],
    markers: [],
    annotations: [],
    changedIndices: []
  };
  assert.doesNotThrow(() => assertTrace([trace[0], {
    ...structuredClone(trace.at(-1)),
    step: 1,
    result: 1,
    view: {
      values: [],
      activeIndices: [],
      ranges: [],
      markers: [],
      annotations: [],
      changedIndices: []
    }
  }], lesson));
});

test("linked-list trace contract rejects broken topology and shared snapshots", () => {
  const lesson = getLesson("linked-lists/reverse-linked-list");

  const danglingLink = lesson.buildTrace({ values: [1, 2, 3] });
  danglingLink[0].view.nodes[0].nextId = "node-missing";
  assert.throws(() => assertTrace(danglingLink, lesson), /dangling next-node/);

  const unknownPointer = lesson.buildTrace({ values: [1, 2, 3] });
  unknownPointer[0].view.pointers[0].nodeId = "node-missing";
  assert.throws(() => assertTrace(unknownPointer, lesson), /unknown pointer/);

  const unsafeState = lesson.buildTrace({ values: [1, 2, 3] });
  unsafeState[0].view.states = [{ nodeId: "node-0", kind: "bad kind", label: "bad" }];
  assert.throws(() => assertTrace(unsafeState, lesson), /node state/);

  const sharedNodes = lesson.buildTrace({ values: [1, 2, 3] });
  sharedNodes[1].view.nodes = sharedNodes[0].view.nodes;
  assert.throws(() => assertTrace(sharedNodes, lesson), /linked-list renderer nodes snapshot/);

  const sharedNodeObject = lesson.buildTrace({ values: [1, 2, 3] });
  sharedNodeObject[1].view.nodes[0] = sharedNodeObject[0].view.nodes[0];
  assert.throws(() => assertTrace(sharedNodeObject, lesson), /linked-list renderer nodes objects/);

  const sharedPointers = lesson.buildTrace({ values: [1, 2, 3] });
  sharedPointers[1].view.pointers = sharedPointers[0].view.pointers;
  assert.throws(() => assertTrace(sharedPointers, lesson), /linked-list renderer pointers snapshot/);
});

test("trace validation rejects non-finite derived fields and compares data without JSON coercion", () => {
  const lesson = getLesson("arrays/find-largest");
  const nonFiniteTrace = lesson.buildTrace({ values: [1, 2, 3] });
  nonFiniteTrace[0].bestValue = Infinity;
  assert.throws(() => assertTrace(nonFiniteTrace, lesson), /non-finite number/);

  const nonFiniteResultLesson = {
    ...lesson,
    solve: () => Infinity
  };
  assert.throws(
    () => buildValidatedTrace(nonFiniteResultLesson, { values: [1, 2, 3] }),
    /algorithm result.*non-finite number/
  );

  let buildCount = 0;
  const subtlyNondeterministicLesson = {
    ...lesson,
    buildTrace: (input) => {
      const trace = lesson.buildTrace(input);
      buildCount += 1;
      if (buildCount === 1) trace[0].optionalDetail = undefined;
      return trace;
    }
  };
  assert.throws(
    () => buildValidatedTrace(subtlyNondeterministicLesson, { values: [1, 2, 3] }),
    /not deterministic/
  );

  const subtlyMutatingLesson = {
    ...lesson,
    buildTrace: (input) => {
      input.unusedDetail = undefined;
      return lesson.buildTrace(input);
    }
  };
  assert.throws(
    () => buildValidatedTrace(subtlyMutatingLesson, { values: [1, 2, 3] }),
    /mutated its input/
  );

  const subtlyMutatingSolverLesson = {
    ...lesson,
    solve: (input) => {
      input.unusedDetail = undefined;
      return lesson.solve(input);
    }
  };
  assert.throws(
    () => buildValidatedTrace(subtlyMutatingSolverLesson, { values: [1, 2, 3] }),
    /mutated its input while solving/
  );
});

test("runtime trace construction builds once while CI verification repeats and solves", () => {
  const sourceLesson = getLesson("arrays/find-largest");
  let builds = 0;
  let solves = 0;
  const measuredLesson = {
    ...sourceLesson,
    buildTrace(input) {
      builds += 1;
      return sourceLesson.buildTrace(input);
    },
    solve(input) {
      solves += 1;
      return sourceLesson.solve(input);
    }
  };
  const input = { values: [3, 1, 5] };

  assert.equal(buildTrace(measuredLesson, input).at(-1).result, 5);
  assert.equal(builds, 1);
  assert.equal(solves, 0);
  assert.deepEqual(input, { values: [3, 1, 5] });

  assert.equal(buildValidatedTrace(measuredLesson, input).at(-1).result, 5);
  assert.equal(builds, 3);
  assert.equal(solves, 1);
});

test("every lesson default and sample produces a valid deterministic trace", () => {
  for (const lesson of lessons) {
    for (const input of [lesson.input.defaultValue, lesson.input.sampleValue]) {
      const before = structuredClone(input);
      const trace = buildValidatedTrace(lesson, input);
      assert.equal(assertTrace(trace, lesson), trace);
      assert.deepEqual(input, before);
      assert.equal(trace.at(-1).phase, "complete");
      assert.deepEqual(trace.at(-1).result, lesson.solve(input));
    }
  }
});

test("number-list input accepts whitespace, decimals, negatives, and duplicates", () => {
  assert.deepEqual(parseNumberList(" -2, 3.5, 3.5 "), [-2, 3.5, 3.5]);
});

test("number formatting preserves distinct finite values without rounding", () => {
  assert.equal(formatNumber(0.0004), "0.0004");
  assert.equal(formatNumber(1.0004), "1.0004");
  assert.equal(formatNumber(1.0005), "1.0005");
  assert.equal(formatNumber(-0), "-0");
  assert.notEqual(formatNumber(1.0004), formatNumber(1.0005));
  for (const value of [Number.MIN_VALUE, 1e-7, 1.2345678901234567, Number.MAX_VALUE]) {
    assert.equal(Number(formatNumber(value)), value);
  }
  for (const value of [Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => formatNumber(value), /finite/);
  }
});

test("number-list input rejects empty, missing, nonnumeric, nonfinite, and oversized values", () => {
  for (const raw of ["", "1,,2", "1, nope", "1, Infinity", Array.from({ length: 13 }, (_, index) => index).join(",")]) {
    assert.throws(() => parseNumberList(raw));
  }
});

test("positive-integer input rejects zero, fractions, and words", () => {
  assert.equal(parsePositiveInteger("3", "Size"), 3);
  for (const raw of ["0", "1.5", "three"]) {
    assert.throws(() => parsePositiveInteger(raw, "Size"));
  }
});

test("findLargest handles ordinary, singleton, negative, and duplicate values without mutation", () => {
  const values = [-3, 7, 2, 7, 4];
  const before = [...values];
  assert.equal(findLargest(values), 7);
  assert.equal(findLargest([4]), 4);
  assert.equal(findLargest([-8, -2, -2]), -2);
  assert.deepEqual(values, before);
});

test("findLargest rejects missing, empty, sparse, and nonfinite inputs", () => {
  const sparse = Array(2);
  sparse[1] = 4;
  assert.throws(() => findLargest());
  assert.throws(() => findLargest([]));
  assert.throws(() => findLargest(sparse));
  assert.throws(() => findLargest([1, Number.NaN]));
});

test("maxWindowSum returns the best fixed range without mutating input", () => {
  const values = [2, 1, 5, 1, 3, 2];
  const before = [...values];
  assert.deepEqual(maxWindowSum(values, 3), { sum: 9, start: 2, end: 4 });
  assert.deepEqual(values, before);
});

test("maxWindowSum handles all-negative values and boundary window sizes", () => {
  assert.deepEqual(maxWindowSum([-5, -2, -8], 1), { sum: -2, start: 1, end: 1 });
  assert.deepEqual(maxWindowSum([3, -1, 4], 3), { sum: 6, start: 0, end: 2 });
});

test("maxWindowSum rejects invalid sizes, sparse values, and non-finite sums", () => {
  for (const size of [0, 1.5, 4]) {
    assert.throws(() => maxWindowSum([1, 2, 3], size));
  }
  const sparse = Array(3);
  sparse[0] = 1;
  sparse[2] = 3;
  assert.throws(() => maxWindowSum(sparse, 2));
  assert.throws(() => maxWindowSum([1, Number.NaN], 1));
  assert.throws(() => maxWindowSum([Number.MAX_VALUE, Number.MAX_VALUE], 2), /sums must remain finite/);

  const lesson = getLesson("arrays/sliding-window");
  assert.throws(
    () => buildValidatedTrace(lesson, { values: [Number.MAX_VALUE, Number.MAX_VALUE], size: 2 }),
    /sums must remain finite/
  );
});

test("reverseArray handles odd, even, singleton, and duplicate values without mutation", () => {
  const values = [-3, 7, 7, 2, 4];
  const before = [...values];
  const result = reverseArray(values);

  assert.deepEqual(result, [4, 2, 7, 7, -3]);
  assert.deepEqual(reverseArray([1, 2, 3, 4]), [4, 3, 2, 1]);
  assert.deepEqual(reverseArray([9]), [9]);
  assert.deepEqual(values, before);
  assert.notEqual(result, values);
});

test("reverseArray rejects missing, empty, sparse, and nonfinite inputs", () => {
  const sparse = Array(2);
  sparse[1] = 1;
  for (const input of [undefined, [], sparse, [1, Number.NaN], [1, Infinity]]) {
    assert.throws(() => reverseArray(input));
  }
});

test("moveZeros is stable across mixed and boundary inputs without mutation", () => {
  const values = [0, -2, 0, -2, 5];
  const before = [...values];
  const result = moveZeros(values);

  assert.deepEqual(result, [-2, -2, 5, 0, 0]);
  assert.deepEqual(moveZeros([0, 0, 0]), [0, 0, 0]);
  assert.deepEqual(moveZeros([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(moveZeros([0]), [0]);
  assert.deepEqual(moveZeros([6]), [6]);
  assert.deepEqual(values, before);
  assert.notEqual(result, values);
});

test("moveZeros rejects missing, empty, sparse, and nonfinite inputs", () => {
  const sparse = Array(2);
  sparse[0] = 1;
  for (const input of [undefined, [], sparse, [1, Number.NaN], [1, -Infinity]]) {
    assert.throws(() => moveZeros(input));
  }
});

test("linked-list traversal handles empty, singleton, duplicate, and ordinary lists", () => {
  assert.deepEqual(traverseLinkedList(null), []);
  assert.deepEqual(traverseLinkedList(createLinkedList([7])), [7]);
  assert.deepEqual(traverseLinkedList(createLinkedList([4, -2, 4, 9])), [4, -2, 4, 9]);
});

test("linked-list traversal rejects a cycle instead of looping forever", () => {
  const head = createLinkedList([1, 2, 3], { cycleEntryIndex: 1 });
  assert.throws(() => traverseLinkedList(head), /acyclic linked list/);
});

test("linked-list reversal rewires the provided nodes in place", () => {
  const head = createLinkedList([1, 2, 3, 4]);
  const reversed = reverseLinkedList(head);

  assert.deepEqual(linkedListToValues(reversed), [4, 3, 2, 1]);
  assert.deepEqual(linkedListToValues(head), [1]);
  assert.notEqual(reversed, head);
  assert.equal(reverseLinkedList(null), null);
  assert.deepEqual(linkedListToValues(reverseLinkedList(createLinkedList([5]))), [5]);
});

test("linked-list reversal rejects a cyclic list before changing its links", () => {
  const head = createLinkedList([1, 2, 3], { cycleEntryIndex: 1 });
  assert.throws(() => reverseLinkedList(head), /acyclic linked list/);
  assert.equal(hasCycle(head), true);
});

test("Floyd cycle detection distinguishes null endings, cycles, and repeated values", () => {
  assert.equal(hasCycle(null), false);
  assert.equal(hasCycle(createLinkedList([1, 2, 1, 2])), false);
  assert.equal(hasCycle(createLinkedList([3, 2, 0, -4], { cycleEntryIndex: 1 })), true);
  assert.equal(hasCycle(createLinkedList([7], { cycleEntryIndex: 0 })), true);
  assert.equal(hasCycle(createLinkedList([1, 2], { cycleEntryIndex: 0 })), true);
});

test("Floyd cycle detection rejects malformed node chains with a controlled error", () => {
  for (const head of [
    undefined,
    { value: Number.NaN, next: null },
    { value: 1, next: 42 },
    { value: 1, next: { value: 2, next: "missing" } }
  ]) {
    assert.throws(() => hasCycle(head), /linked-list node/);
  }
});

test("linked-list model rejects invalid values, sparse input, and cycle entries", () => {
  const sparse = Array(2);
  sparse[1] = 4;
  for (const values of [undefined, sparse, [1, Number.NaN], [Infinity]]) {
    assert.throws(() => createLinkedList(values));
  }
  for (const cycleEntryIndex of [-1, 3, 1.5]) {
    assert.throws(() => createLinkedList([1, 2, 3], { cycleEntryIndex }));
  }
});

test("find-largest trace covers update and no-update decisions", () => {
  const lesson = getLesson("arrays/find-largest");
  const trace = buildValidatedTrace(lesson, { values: [3, 5, 5, 1] });
  assert.ok(trace.some((step) => step.codeSteps.includes("update-largest")));
  assert.ok(trace.some((step) => step.phase === "compare" && !step.changed));
  assert.equal(trace.at(-1).bestIndex, 1);
});

test("sliding-window trace preserves range width and running sums", () => {
  const lesson = getLesson("arrays/sliding-window");
  const input = { values: [2, 1, 5, 1, 3, 2], size: 3 };
  const trace = buildValidatedTrace(lesson, input);
  for (const step of trace.filter((item) => item.phase !== "complete")) {
    assert.equal(step.currentEnd - step.currentStart + 1, input.size);
    const oracle = input.values
      .slice(step.currentStart, step.currentEnd + 1)
      .reduce((sum, value) => sum + value, 0);
    assert.equal(step.currentSum, oracle);
  }
  assert.equal(trace[1].leavingIndex, 0);
  assert.equal(trace[1].enteringIndex, 3);
});

test("reverse-array trace exposes pointer checks, exact swaps, and settled positions", () => {
  const lesson = getLesson("arrays/reverse-array");
  const input = { values: [2, 1, 4, 3, 5] };
  const trace = buildValidatedTrace(lesson, input);

  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "check",
    "swap",
    "advance",
    "check",
    "swap",
    "advance",
    "check",
    "complete"
  ]);
  assert.deepEqual(
    trace.filter((step) => step.phase === "swap").map((step) => step.view.values),
    [
      [5, 1, 4, 3, 2],
      [5, 3, 4, 1, 2]
    ]
  );
  for (const step of trace.filter((item) => item.phase === "swap")) {
    assert.equal(step.leftValue, step.view.values[step.leftIndex]);
    assert.equal(step.rightValue, step.view.values[step.rightIndex]);
    assert.notEqual(step.previousLeftValue, null);
    assert.notEqual(step.previousRightValue, null);
  }
  assert.equal(trace.at(-2).canSwap, false);
  assert.equal(trace.at(-1).swapCount, Math.floor(input.values.length / 2));

  const expected = reverseArray(input.values);
  for (const step of trace) {
    for (const range of step.view.ranges.filter((item) => item.kind === "settled")) {
      for (let index = range.start; index <= range.end; index += 1) {
        assert.equal(step.view.values[index], expected[index]);
      }
    }
  }
});

test("reverse-array singleton and duplicate traces keep pointer state inspectable", () => {
  const lesson = getLesson("arrays/reverse-array");
  const singleton = buildValidatedTrace(lesson, { values: [7] });
  assert.deepEqual(singleton.map((step) => step.phase), ["initialize", "check", "complete"]);
  assert.equal(singleton[0].view.markers[0].kind, "both");
  assert.equal(singleton.at(-1).swapCount, 0);

  const duplicates = buildValidatedTrace(lesson, { values: [7, 7] });
  const swap = duplicates.find((step) => step.phase === "swap");
  assert.deepEqual(swap.view.values, [7, 7]);
  assert.equal(swap.view.annotations.length, 2);
  assert.deepEqual(swap.view.changedIndices, [0, 1]);
});

test("move-zeros trace preserves the stable-prefix invariant", () => {
  const lesson = getLesson("arrays/move-zeros");
  const input = { values: [0, 1, 0, 3] };
  const trace = buildValidatedTrace(lesson, input);

  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "skip-zero",
    "move-value",
    "skip-zero",
    "move-value",
    "complete"
  ]);
  assert.deepEqual(trace[2].view.values, [1, 0, 0, 3]);
  assert.deepEqual(trace[4].view.values, [1, 3, 0, 0]);

  const expectedNonZeros = input.values.filter((value) => value !== 0);
  for (const step of trace.filter((item) => item.phase !== "initialize" && item.phase !== "complete")) {
    assert.equal(step.nonZeroCount, step.nextWriteIndex);
    assert.deepEqual(
      step.view.values.slice(0, step.nonZeroCount),
      expectedNonZeros.slice(0, step.nonZeroCount)
    );
    for (let index = step.nonZeroCount; index <= step.readIndex; index += 1) {
      assert.equal(step.view.values[index], 0);
    }
    const writeMarker = step.view.markers.find((marker) => marker.kind === "write");
    if (step.nextWriteIndex < step.view.values.length) {
      assert.equal(writeMarker.index, step.nextWriteIndex);
    } else {
      assert.equal(writeMarker, undefined);
    }
  }
});

test("move-zeros trace covers aligned pointers, overlapping markers, and all-zero input", () => {
  const lesson = getLesson("arrays/move-zeros");
  const noZeros = buildValidatedTrace(lesson, { values: [2, 4] });
  assert.ok(noZeros.some((step) => step.phase === "keep-value"));
  assert.deepEqual(
    noZeros[0].view.markers.map((marker) => marker.kind),
    ["read", "write"]
  );

  const allZeros = buildValidatedTrace(lesson, { values: [0, 0] });
  assert.equal(allZeros.at(-1).nonZeroCount, 0);
  assert.deepEqual(allZeros.at(-1).result, [0, 0]);
});

test("array view projection exposes active, range, marker, and accessible state", () => {
  const models = projectArrayView({
    values: [2, 4, 6],
    activeIndices: [2],
    ranges: [{ start: 1, end: 2, kind: "window", label: "current window" }],
    markers: [
      { index: 2, kind: "read", label: "read" },
      { index: 2, kind: "write", label: "write" }
    ],
    annotations: [{ index: 1, label: "left" }],
    changedIndices: [2]
  });
  assert.equal(models[2].active, true);
  assert.equal(models[2].changed, true);
  assert.equal(models[2].ranges[0].isEnd, true);
  assert.deepEqual(models[2].markers.map((marker) => marker.kind), ["read", "write"]);
  assert.match(models[2].ariaLabel, /changed this step, current window, read, write/);
  assert.equal(models[1].annotations[0].label, "left");
});

test("traverse-list trace records each reachable node before following next", () => {
  const lesson = getLesson("linked-lists/traverse-linked-list");
  const trace = buildValidatedTrace(lesson, { values: [2, 4, 2] });

  assert.deepEqual(trace.map((step) => step.phase), [
    "initialize",
    "check", "visit", "advance",
    "check", "visit", "advance",
    "check", "visit", "advance",
    "check",
    "complete"
  ]);
  assert.deepEqual(trace.at(-1).result, [2, 4, 2]);
  assert.equal(trace.at(-1).visitedCount, 3);
  assert.deepEqual(
    trace.at(-1).view.states.map((state) => state.nodeId),
    ["node-0", "node-1", "node-2"]
  );
  assert.equal(trace.at(-1).view.pointers[0].nodeId, null);

  const empty = buildValidatedTrace(lesson, { values: [] });
  assert.deepEqual(empty.map((step) => step.phase), ["initialize", "check", "complete"]);
  assert.deepEqual(empty.at(-1).result, []);
});

test("reverse-list trace protects next before rewiring every connection", () => {
  const lesson = getLesson("linked-lists/reverse-linked-list");
  const input = { values: [1, 2, 3] };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(lesson, input);
  const rewires = trace.filter((step) => step.phase === "reverse-link");

  assert.equal(rewires.length, 3);
  assert.ok(rewires.every((step) => step.view.changedNodeIds.length === 1));
  assert.deepEqual(rewires.map((step) => step.currentIndex), [0, 1, 2]);
  assert.deepEqual(trace.at(-1).result, [3, 2, 1]);
  assert.deepEqual(
    trace.at(-1).view.nodes.map((node) => node.nextId),
    [null, "node-0", "node-1"]
  );
  assert.deepEqual(input, before);
});

test("detect-cycle trace terminates by identity meeting or null", () => {
  const lesson = getLesson("linked-lists/detect-cycle");
  const cyclic = buildValidatedTrace(lesson, {
    values: [3, 2, 0, -4],
    cycleEntryIndex: 1
  });
  assert.equal(cyclic.at(-1).result, true);
  assert.equal(cyclic.at(-1).slowIndex, cyclic.at(-1).fastIndex);
  assert.ok(cyclic.at(-1).view.states.some((state) => state.kind === "meeting"));
  assert.ok(cyclic.every((step) => step.rounds <= 4));

  const acyclic = buildValidatedTrace(lesson, {
    values: [1, 2, 3, 4, 5],
    cycleEntryIndex: null
  });
  assert.equal(acyclic.at(-1).result, false);
  assert.ok(
    acyclic.at(-1).view.pointers.some((pointer) => pointer.nodeId === null)
    || acyclic.at(-1).fastIndex === 4
  );

  const selfCycle = buildValidatedTrace(lesson, {
    values: [9],
    cycleEntryIndex: 0
  });
  assert.equal(selfCycle.at(-1).result, true);
  assert.equal(selfCycle.at(-1).slowIndex, 0);
});

test("linked-list projection exposes topology, stacked pointers, states, and accessible labels", () => {
  const projection = projectLinkedListView({
    nodes: [
      { id: "node-0", index: 0, value: 10, nextId: "node-2" },
      { id: "node-1", index: 1, value: 20, nextId: "node-0" },
      { id: "node-2", index: 2, value: 30, nextId: "node-3" },
      { id: "node-3", index: 3, value: 40, nextId: "node-0" },
      { id: "node-4", index: 4, value: 50, nextId: "node-4" }
    ],
    pointers: [
      { nodeId: "node-2", kind: "slow", label: "slow" },
      { nodeId: "node-2", kind: "fast", label: "fast" },
      { nodeId: null, kind: "previous", label: "previous" }
    ],
    activeNodeIds: ["node-2"],
    changedNodeIds: ["node-3"],
    states: [{ nodeId: "node-2", kind: "visited", label: "visited" }],
    annotations: [{ nodeId: "node-2", label: "pointers meet" }]
  });

  assert.deepEqual(
    projection.links.map((link) => link.direction),
    ["forward-jump", "backward-adjacent", "forward-adjacent", "return", "self-loop"]
  );
  assert.deepEqual(projection.nodes[2].pointers.map((pointer) => pointer.kind), ["slow", "fast"]);
  assert.equal(projection.nodes[2].active, true);
  assert.equal(projection.nodes[3].changed, true);
  assert.equal(projection.nullPointers[0].kind, "previous");
  assert.match(projection.nodes[2].ariaLabel, /next points to node 3.*slow.*fast.*visited.*pointers meet/);
  assert.match(projection.nullPointers[0].ariaLabel, /points to null/);
});

test("player loads lessons and input while preserving studio preferences", () => {
  let state = createState();
  state = playerReducer(state, { type: "SET_SPEED", speed: 500 });
  state = playerReducer(state, { type: "TOGGLE_GUIDE" });
  state = playerReducer(state, {
    type: "LOAD_LESSON",
    lessonId: "next",
    trace: [{ step: 0 }, { step: 1 }],
    input: { values: [2] }
  });
  assert.equal(state.lessonId, "next");
  assert.equal(state.index, 0);
  assert.equal(state.speed, 500);
  assert.equal(state.guideMinimized, true);
});

test("player next, previous, and indexed steps clamp and set coherent statuses", () => {
  let state = createState();
  state = playerReducer(state, { type: "NEXT" });
  assert.deepEqual([state.index, state.status], [1, "paused"]);
  state = playerReducer(state, { type: "STEP", index: 99 });
  assert.deepEqual([state.index, state.status], [2, "complete"]);
  state = playerReducer(state, { type: "PREVIOUS" });
  assert.deepEqual([state.index, state.status], [1, "paused"]);
  state = playerReducer(state, { type: "STEP", index: Number.NaN });
  assert.deepEqual([state.index, state.status], [0, "ready"]);
});

test("player play, tick, pause, reset, and validation error remain coherent", () => {
  let state = createState();
  state = playerReducer(state, { type: "PLAY" });
  assert.equal(state.status, "playing");
  state = playerReducer(state, { type: "TICK" });
  assert.deepEqual([state.index, state.status], [1, "playing"]);
  state = playerReducer(state, { type: "PAUSE" });
  assert.equal(state.status, "paused");
  state = playerReducer(state, { type: "VALIDATION_ERROR", message: "Invalid" });
  assert.equal(state.status, "error");
  assert.equal(state.index, 1);
  state = playerReducer(state, { type: "RESET" });
  assert.deepEqual([state.index, state.status, state.error], [0, "ready", ""]);
});

test("player restarts after completion and normalizes speed", () => {
  let state = createState();
  state = playerReducer(state, { type: "STEP", index: 2 });
  state = playerReducer(state, { type: "PLAY" });
  assert.deepEqual([state.index, state.status], [0, "playing"]);
  state = playerReducer(state, { type: "SET_SPEED", speed: Number.NaN });
  assert.equal(state.speed, 850);
  state = playerReducer(state, { type: "SET_SPEED", speed: 10 });
  assert.equal(state.speed, 250);
});

test("speed control maps rightward movement to faster playback", () => {
  assert.equal(controlValueToPlaybackDelay(350), 1400);
  assert.equal(controlValueToPlaybackDelay(1400), 350);
  assert.ok(
    controlValueToPlaybackDelay(1000) < controlValueToPlaybackDelay(700)
  );
});

test("speed control and playback delay remain exact inverses", () => {
  for (const delay of [350, 500, 850, 1100, 1400]) {
    assert.equal(
      controlValueToPlaybackDelay(playbackDelayToControlValue(delay)),
      delay
    );
  }
});

test("speed labels describe the effective playback delay", () => {
  assert.equal(playbackSpeedLabel(350), "1.5×");
  assert.equal(playbackSpeedLabel(850), "1×");
  assert.equal(playbackSpeedLabel(1400), "0.75×");
});

test("static server maps the landing page, studio, and shared assets", () => {
  assert.match(resolveRequest("/"), /studio[\\/]home\.html$/);
  assert.match(resolveRequest("/index.html"), /studio[\\/]home\.html$/);
  assert.match(resolveRequest("/studio"), /studio[\\/]index\.html$/);
  assert.match(resolveRequest("/studio/"), /studio[\\/]index\.html$/);
  assert.match(resolveRequest("/home.css"), /studio[\\/]home\.css$/);
  assert.match(resolveRequest("/styles.css"), /studio[\\/]styles\.css$/);
  assert.match(resolveRequest("/pip.css"), /studio[\\/]pip\.css$/);
  assert.match(resolveRequest("/studio/src/app.mjs"), /studio[\\/]src[\\/]app\.mjs$/);
  assert.match(resolveRequest("/src/pip.mjs"), /studio[\\/]src[\\/]pip\.mjs$/);
  assert.match(resolveRequest("/arrays/find-largest.mjs"), /arrays[\\/]find-largest\.mjs$/);
  assert.match(resolveRequest("/arrays/reverse-array.mjs"), /arrays[\\/]reverse-array\.mjs$/);
  assert.match(resolveRequest("/arrays/move-zeros.mjs"), /arrays[\\/]move-zeros\.mjs$/);
  assert.match(resolveRequest("/linked-lists/model.mjs"), /linked-lists[\\/]model\.mjs$/);
  assert.match(resolveRequest("/linked-lists/detect-cycle.mjs"), /linked-lists[\\/]detect-cycle\.mjs$/);
});

test("static server resolves only explicitly allowed directories", () => {
  assert.equal(resolveRequest("/package.json"), null);
  assert.equal(resolveRequest("/arrays/%2e%2e%2fpackage.json"), null);
  assert.equal(resolveRequest("/arrays/%5c..%5cpackage.json"), null);
  assert.equal(resolveRequest("/arrays/%5c..%5c.git%5cconfig"), null);
  assert.equal(resolveRequest("/linked-lists/%2e%2e%2fpackage.json"), null);
  assert.equal(resolveRequest("/linked-lists/%5c..%5cpackage.json"), null);
  assert.equal(resolveRequest("/src/%5c..%5c..%5cpackage.json"), null);
  assert.equal(resolveRequest("/src/%2e%2e%2fserver.mjs"), null);
  assert.equal(resolveRequest("/src/%5c..%5cserver.mjs"), null);
  assert.equal(resolveRequest("/studio/../package.json"), null);
  assert.equal(resolveRequest("/studio/%5c..%5cserver.mjs"), null);
  assert.equal(resolveRequest("/%E0%A4%A"), null);
});

test("lesson navigation accepts safe encoded hashes and rejects malformed values", () => {
  const ids = lessons.map((lesson) => lesson.id);
  assert.equal(readLessonIdFromHash("#lesson=arrays/find-largest", ids), "arrays/find-largest");
  assert.equal(readLessonIdFromHash("#lesson=arrays%2Fsliding-window", ids), "arrays/sliding-window");
  assert.equal(readLessonIdFromHash("#lesson=arrays%2Freverse-array", ids), "arrays/reverse-array");
  assert.equal(readLessonIdFromHash("#lesson=arrays%2Fmove-zeros", ids), "arrays/move-zeros");
  assert.equal(
    readLessonIdFromHash("#lesson=linked-lists%2Ftraverse-linked-list", ids),
    "linked-lists/traverse-linked-list"
  );
  assert.equal(
    readLessonIdFromHash("#lesson=linked-lists%2Freverse-linked-list", ids),
    "linked-lists/reverse-linked-list"
  );
  assert.equal(
    readLessonIdFromHash("#lesson=linked-lists%2Fdetect-cycle", ids),
    "linked-lists/detect-cycle"
  );
  assert.equal(
    readLessonIdFromHash("#lesson=strings%2Fvalid-palindrome", ids),
    "strings/valid-palindrome"
  );
  assert.equal(readLessonIdFromHash("#lesson=missing", ids), null);
  assert.equal(readLessonIdFromHash("#other=value", ids), null);
  assert.equal(readLessonIdFromHash("#lesson=%E0%A4%A", ids), null);
  assert.equal(lessonHash("arrays/find-largest"), "#lesson=arrays%2Ffind-largest");
});

test("Pip maps player and learning states to an expressive, resilient emotion vocabulary", () => {
  assert.equal(pipStateForPlayer("ready"), "curious");
  assert.equal(pipStateForPlayer("paused"), "thinking");
  assert.equal(pipStateForPlayer("playing"), "guiding");
  assert.equal(pipStateForPlayer("complete"), "celebrating");
  assert.equal(pipStateForPlayer("error"), "caution");
  assert.equal(pipStateForPlayer("unknown"), "idle");
  assert.equal(normalizePipState("guiding"), "guiding");
  assert.equal(normalizePipState("cool"), "cool");
  assert.equal(normalizePipState("invented"), "idle");
  assert.equal(isPipEmotion("aha"), true);
  assert.equal(isPipEmotion("invented"), false);

  assert.equal(pipEmotionForLearning({ status: "ready" }), "curious");
  assert.equal(pipEmotionForLearning({ status: "ready", predictionLocked: true }), "thinking");
  assert.equal(pipEmotionForLearning({ status: "paused", stepIndex: 1, predictionLocked: true }), "encouraging");
  assert.equal(pipEmotionForLearning({ status: "paused", stepIndex: 2, cue: "aha" }), "aha");
  assert.equal(pipEmotionForLearning({ status: "playing", stepIndex: 2, cue: "cool" }), "cool");
  assert.equal(pipEmotionForLearning({ status: "complete", stepIndex: 8, cue: "cool" }), "celebrating");
  assert.equal(pipEmotionForLearning({ status: "paused", stepIndex: 2, cue: "aha", hasError: true }), "caution");
  assert.equal(pipEmotionLabel("encouraging"), "You’ve got this");
  assert.equal(pipEmotionLabel("invented"), "Ready");
  assert.equal(pipSenseiLine("thinking"), "Pause. Name what must remain true.");
  assert.equal(pipSenseiLine("cool", "two-pointers"), "You recognize two pointers. Reuse the pattern.");
  assert.equal(pipSenseiLine("invented"), "Settle in. Precision before speed.");
});

test("lessons reserve Pip reactions for meaningful algorithm moments", () => {
  const expectations = [
    ["arrays/find-largest", "compare", "aha"],
    ["searching/binary-search", "found", "aha"],
    ["stacks/valid-parentheses", "match", "encouraging"],
    ["dynamic-programming/memoized-fibonacci", "cache-hit", "cool"],
    ["graphs/unweighted-shortest-path", "discover-target", "aha"]
  ];

  for (const [lessonId, phase, cue] of expectations) {
    const currentLesson = getLesson(lessonId);
    const trace = currentLesson.buildTrace(structuredClone(currentLesson.input.defaultValue));
    assert.ok(trace.some((step) => step.phase === phase && step.pipCue === cue), `${lessonId} should include ${cue} at ${phase}`);
  }
});

test("Pip mounts an idempotent decorative structure and supports observer fallback", () => {
  const document = createFakeDocument();
  const attributes = {};
  const element = {
    children: [],
    dataset: { state: "curious" },
    ownerDocument: document,
    replaceCount: 0,
    replaceChildren(fragment) {
      this.replaceCount += 1;
      this.children = [...fragment.children];
    },
    setAttribute(name, value) {
      attributes[name] = value;
    }
  };
  const root = {
    defaultView: {},
    querySelectorAll() {
      return [element];
    }
  };

  assert.equal(mountPips(root)[0], element);
  assert.equal(element.replaceCount, 1);
  assert.equal(element.children.length, 6);
  assert.equal(element.children[0].className, "pip-body");
  assert.deepEqual(element.children[0].children.map(({ className }) => className), [
    "pip-headband",
    "pip-face",
    "pip-arm pip-arm--left",
    "pip-arm pip-arm--right"
  ]);
  assert.deepEqual(element.children[0].children[0].children.map(({ className }) => className), [
    "pip-headband-knot",
    "pip-headband-tail pip-headband-tail--one",
    "pip-headband-tail pip-headband-tail--two"
  ]);
  assert.deepEqual(
    element.children[0].children[1].children.map(({ className }) => className),
    [
      "pip-brow pip-brow--left",
      "pip-brow pip-brow--right",
      "pip-eye pip-eye--left",
      "pip-eye pip-eye--right",
      "pip-mouth",
      "pip-glasses"
    ]
  );
  assert.equal(element.children[1].children[0].className, "pip-orbit-dot");
  assert.equal(element.children[2].className, "pip-emotion-mark");
  assert.equal(attributes["aria-hidden"], "true");
  assert.equal(element.dataset.visible, "true");

  const originalLeftArm = element.children[0].children[2];
  const originalRightArm = element.children[0].children[3];
  mountPips(root);
  assert.equal(element.replaceCount, 1);
  assert.equal(element.children[0].children[2], originalLeftArm);
  assert.equal(element.children[0].children[3], originalRightArm);
  assert.equal(observePipVisibility(root), null);
  assert.equal(element.dataset.visible, "true");
});

test("Pip visibility observer pauses offscreen companions", () => {
  let callback;
  const observed = [];
  class FakeObserver {
    constructor(observerCallback) {
      callback = observerCallback;
    }
    observe(element) {
      observed.push(element);
    }
  }

  const element = { dataset: {} };
  const root = {
    defaultView: { IntersectionObserver: FakeObserver },
    querySelectorAll() {
      return [element];
    }
  };

  assert.ok(observePipVisibility(root) instanceof FakeObserver);
  assert.equal(observed[0], element);
  assert.equal(element.dataset.visible, "false");
  callback([{ target: element, isIntersecting: true }]);
  assert.equal(element.dataset.visible, "true");
  callback([{ target: element, isIntersecting: false }]);
  assert.equal(element.dataset.visible, "false");
});

function createState() {
  return createPlayerState({
    lessonId: "test",
    trace: [{ step: 0 }, { step: 1 }, { step: 2 }],
    input: { values: [1, 2, 3] }
  });
}

function createFakeDocument() {
  return {
    createDocumentFragment: createFakeNode,
    createElement: createFakeNode
  };
}

function createFakeNode() {
  return {
    children: [],
    className: "",
    append(...children) {
      this.children.push(...children);
    }
  };
}
