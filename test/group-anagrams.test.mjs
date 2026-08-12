import test from "node:test";
import assert from "node:assert/strict";
import {
  anagramSignature,
  groupAnagrams,
  maximumAnagramWordCharacters,
  maximumAnagramWords,
  normalizeAnagramWord,
  validateGroupAnagramsInput
} from "../hash-maps-and-sets/group-anagrams.mjs";
import { buildGroupAnagramsTrace } from "../studio/src/group-anagrams.mjs";
import {
  groupAnagramsLesson,
  parseGroupAnagramWords
} from "../studio/src/lessons/group-anagrams.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";

test("groupAnagrams preserves group discovery order, word order, case, and duplicates", () => {
  const words = ["eat", "Tea", "tan", "ate", "nat", "bat", "Tea"];
  const before = [...words];
  assert.deepEqual(groupAnagrams(words), [
    ["eat", "Tea", "ate", "Tea"],
    ["tan", "nat"],
    ["bat"]
  ]);
  assert.deepEqual(words, before);
});

test("Group Anagrams uses deterministic Unicode lowercase and code-point signatures", () => {
  assert.equal(normalizeAnagramWord("ÉTÉ"), "été");
  assert.equal(anagramSignature("Tea"), "aet");
  assert.equal(anagramSignature("Été"), anagramSignature("TÉé"));
  assert.equal(anagramSignature("𐐀A"), anagramSignature("a𐐨"));
  assert.deepEqual(groupAnagrams(["Été", "TÉé", "𐐀A", "a𐐨"]), [
    ["Été", "TÉé"],
    ["𐐀A", "a𐐨"]
  ]);
});

test("Group Anagrams enforces bounded dense Unicode-letter-only words", () => {
  const validMaximum = Array.from({ length: maximumAnagramWords }, (_, index) => (
    String.fromCodePoint(0x41 + index).repeat(maximumAnagramWordCharacters)
  ));
  assert.equal(validateGroupAnagramsInput(validMaximum), validMaximum);

  for (const invalid of [
    null,
    [],
    Array(2),
    [""],
    ["two words"],
    ["word-2"],
    ["e\u0301"],
    ["a".repeat(maximumAnagramWordCharacters + 1)],
    Array.from({ length: maximumAnagramWords + 1 }, () => "word")
  ]) {
    assert.throws(() => validateGroupAnagramsInput(invalid), /Group Anagrams/);
    assert.throws(() => groupAnagrams(invalid), /Group Anagrams/);
  }
});

test("Group Anagrams lesson parses comma-separated words and declares lookup metadata", () => {
  assert.deepEqual(parseGroupAnagramWords(" ÉTÉ, téÉ, Tea "), ["ÉTÉ", "téÉ", "Tea"]);
  assert.deepEqual(
    groupAnagramsLesson.input.parse({ words: "eat, tea, bat" }),
    { words: ["eat", "tea", "bat"] }
  );
  assert.deepEqual(
    groupAnagramsLesson.input.serialize({ words: ["eat", "tea"] }),
    { words: "eat, tea" }
  );
  for (const invalid of ["", "eat,,tea", "two words"] ) {
    assert.throws(() => parseGroupAnagramWords(invalid));
  }

  assert.equal(groupAnagramsLesson.id, "hash-maps-and-sets/group-anagrams");
  assert.equal(groupAnagramsLesson.order, 16);
  assert.equal(groupAnagramsLesson.renderer, "lookup");
  assert.deepEqual(groupAnagramsLesson.prerequisites, [
    "strings/first-non-repeating",
    "arrays/frequency-count"
  ]);
  assert.deepEqual(groupAnagramsLesson.patterns, [
    "frequency-map",
    "canonical-key",
    "grouping"
  ]);
  assert.equal(assertLesson(groupAnagramsLesson), groupAnagramsLesson);
});

test("Group Anagrams trace classifies every word by canonical signature", () => {
  const trace = buildGroupAnagramsTrace(["eat", "Tea", "tan", "ate"]);
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "create-group",
    "append-group",
    "create-group",
    "append-group",
    "complete"
  ]);
  assert.deepEqual(trace[1].view.entries, [{ key: "aet", value: "eat", state: "updated" }]);
  assert.deepEqual(trace[2].view.entries, [{ key: "aet", value: "eat, Tea", state: "updated" }]);
  assert.deepEqual(trace[3].view.entries, [
    { key: "aet", value: "eat, Tea", state: "grouped" },
    { key: "ant", value: "tan", state: "updated" }
  ]);
  assert.equal(trace[4].signature, "aet");
  assert.equal(trace[4].groupIndex, 0);
  assert.equal(trace[4].groupSize, 3);
  assert.deepEqual(trace.at(-1).view.resultKeys, ["aet", "ant"]);
  assert.deepEqual(trace.at(-1).result, [["eat", "Tea", "ate"], ["tan"]]);
});

test("Group Anagrams trace is deterministic, solver-aligned, and deeply owned", () => {
  const input = { words: ["Été", "TÉé", "Tea", "eat", "bat"] };
  const before = structuredClone(input);
  const trace = buildValidatedTrace(groupAnagramsLesson, input);
  assert.equal(assertTrace(trace, groupAnagramsLesson), trace);
  assert.deepEqual(trace.at(-1).result, groupAnagrams(input.words));
  assert.deepEqual(input, before);

  assert.equal(new Set(trace.map((step) => step.view)).size, trace.length);
  for (const property of ["entries", "activeKeys", "annotations", "resultKeys"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  for (const property of ["entries", "annotations"]) {
    const objects = trace.flatMap((step) => step.view[property]);
    assert.equal(new Set(objects).size, objects.length, property);
  }

  trace[2].view.entries = trace[1].view.entries;
  assert.throws(() => assertTrace(trace, groupAnagramsLesson), /entries snapshot/);
});
