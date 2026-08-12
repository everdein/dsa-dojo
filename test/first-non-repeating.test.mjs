import test from "node:test";
import assert from "node:assert/strict";
import {
  findFirstNonRepeatingCharacter,
  maximumFirstNonRepeatingCharacters,
  validateFirstNonRepeatingInput
} from "../strings/first-non-repeating.mjs";
import { buildFirstNonRepeatingTrace } from "../studio/src/first-non-repeating.mjs";
import {
  firstNonRepeatingLesson,
  parseFirstNonRepeatingText
} from "../studio/src/lessons/first-non-repeating.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("first-non-repeating preserves raw Unicode positions while counting normalized keys", () => {
  const cases = [
    ["aA, b! cC", { index: 4, character: "b", normalized: "b" }],
    ["!!Éé—𐐀?", { index: 5, character: "𐐀", normalized: "𐐨" }],
    ["😀A,a b", { index: 5, character: "b", normalized: "b" }],
    ["٤-٥٤", { index: 2, character: "٥", normalized: "٥" }],
    ["7", { index: 0, character: "7", normalized: "7" }],
    ["aA!!bB", null]
  ];

  for (const [text, expected] of cases) {
    assert.deepEqual(findFirstNonRepeatingCharacter(text), expected, text);
  }
});

test("first-non-repeating matches L08 bounded raw-text validation semantics", () => {
  const maximum = `${"😀".repeat(maximumFirstNonRepeatingCharacters - 1)}A`;
  assert.equal(Array.from(maximum).length, maximumFirstNonRepeatingCharacters);
  assert.equal(validateFirstNonRepeatingInput(maximum), maximum);

  assert.throws(
    () => validateFirstNonRepeatingInput(`${"😀".repeat(maximumFirstNonRepeatingCharacters)}A`),
    /48 characters or fewer/
  );
  for (const invalid of [undefined, null, 7, {}, [], "", "   ", "😀!?—"]) {
    assert.throws(() => validateFirstNonRepeatingInput(invalid));
  }
});

test("first-non-repeating lesson preserves raw input and declares sequence plus lookup panels", () => {
  const raw = "  A,a! b  ";
  assert.equal(parseFirstNonRepeatingText(raw), raw);
  assert.deepEqual(firstNonRepeatingLesson.input.parse({ text: raw }), { text: raw });
  assert.deepEqual(firstNonRepeatingLesson.input.serialize({ text: raw }), { text: raw });
  assert.throws(() => parseFirstNonRepeatingText("!? 😀"), /letter or number/);

  assert.equal(firstNonRepeatingLesson.id, "strings/first-non-repeating");
  assert.equal(firstNonRepeatingLesson.order, 11);
  assert.equal(Object.hasOwn(firstNonRepeatingLesson, "renderer"), false);
  assert.deepEqual(firstNonRepeatingLesson.prerequisites, ["strings/valid-palindrome"]);
  assert.deepEqual(firstNonRepeatingLesson.patterns, ["strings", "frequency-map", "two-pass"]);
  assert.deepEqual(firstNonRepeatingLesson.views, [
    { id: "characters", renderer: "sequence", heading: "Original text" },
    { id: "counts", renderer: "lookup", heading: "Normalized character → count" }
  ]);
  assert.equal(assertLesson(firstNonRepeatingLesson), firstNonRepeatingLesson);
  assert.deepEqual(
    buildValidatedTrace(firstNonRepeatingLesson, { text: "A,a! b" }).at(-1).result,
    { index: 5, character: "b", normalized: "b" }
  );
});

test("first-non-repeating trace counts completely before scanning raw order", () => {
  const input = "aA, b! cC";
  const trace = buildFirstNonRepeatingTrace(input);
  const selectionStart = trace.findIndex((step) => step.phase === "begin-selection");

  assert.ok(selectionStart > 0);
  assert.ok(trace.slice(1, selectionStart).every((step) => step.pass === 1));
  assert.ok(trace.slice(selectionStart).every((step) => step.pass === 2));
  assert.deepEqual(trace[selectionStart].views.counts.entries, [
    { key: "a", value: 2, state: "counted" },
    { key: "b", value: 1, state: "counted" },
    { key: "c", value: 2, state: "counted" }
  ]);

  const found = trace.find((step) => step.phase === "found");
  assert.equal(found.currentIndex, 4);
  assert.equal(found.normalizedCharacter, "b");
  assert.equal(found.currentCount, 1);
  assert.deepEqual(found.views.counts.activeKeys, ["b"]);
  assert.deepEqual(found.views.counts.resultKeys, ["b"]);
  assert.deepEqual(trace.at(-1).result, { index: 4, character: "b", normalized: "b" });
});

test("first-non-repeating trace shows ignored formatting and case-shared keys", () => {
  const trace = buildFirstNonRepeatingTrace("!!Éé—𐐀?");
  const secondEAccent = trace.find((step) => step.phase === "count" && step.currentIndex === 3);

  assert.equal(secondEAccent.normalizedCharacter, "é");
  assert.equal(secondEAccent.currentCount, 2);
  assert.deepEqual(
    secondEAccent.views.counts.entries.find((entry) => entry.key === "é"),
    { key: "é", value: 2, state: "updated" }
  );
  assert.equal(trace.at(-1).ignoredCount, 4);
  assert.deepEqual(trace.at(-1).result, { index: 5, character: "𐐀", normalized: "𐐨" });
  assert.deepEqual(trace.at(-1).views.characters.values, Array.from("!!Éé—𐐀?"));
});

test("first-non-repeating no-result trace checks every meaningful position and returns null", () => {
  const trace = buildFirstNonRepeatingTrace("aA!!bB");
  assert.equal(trace.some((step) => step.phase === "found"), false);
  assert.equal(trace.filter((step) => step.phase === "repeated").length, 4);
  assert.equal(trace.at(-1).selectionChecks, 4);
  assert.equal(trace.at(-1).result, null);
  assert.deepEqual(trace.at(-1).views.counts.resultKeys, []);
  assert.deepEqual(trace.at(-1).views.counts.activeKeys, []);
});

test("first-non-repeating trace is deterministic, solver-aligned, immutable, and deeply owned", () => {
  const input = "😀A,a—bB c";
  const first = buildFirstNonRepeatingTrace(input);
  const second = buildFirstNonRepeatingTrace(input);

  assert.deepEqual(first, second);
  assert.deepEqual(first.at(-1).result, findFirstNonRepeatingCharacter(input));
  first.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.ok(step.codeSteps.length > 0);
    assert.equal(typeof step.narration, "string");
    assert.equal(typeof step.prompt, "string");
    assert.deepEqual(step.views.characters.values, Array.from(input));
  });

  for (const panelId of ["characters", "counts"]) {
    assert.equal(new Set(first.map((step) => step.views[panelId])).size, first.length, panelId);
  }
  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(
      new Set(first.map((step) => step.views.characters[property])).size,
      first.length,
      `characters.${property}`
    );
  }
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(
      new Set(first.map((step) => step.views.counts[property])).size,
      first.length,
      `counts.${property}`
    );
  }
  for (const [panelId, properties] of [
    ["characters", ["ranges", "markers", "annotations"]],
    ["counts", ["entries", "annotations"]]
  ]) {
    for (const property of properties) {
      const objects = first.flatMap((step) => step.views[panelId][property]);
      assert.equal(new Set(objects).size, objects.length, `${panelId}.${property}`);
    }
  }
});
