import test from "node:test";
import assert from "node:assert/strict";
import {
  countTriePrefix,
  prefixCount
} from "../tries/prefix-count.mjs";
import {
  createTrie,
  maximumTrieTotalCharacters,
  validateTrieInput
} from "../tries/trie-insert-search.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { buildPrefixCountTrace } from "../studio/src/prefix-count.mjs";
import {
  parsePrefixWords,
  prefixCountLesson
} from "../studio/src/lessons/prefix-count.mjs";

test("prefix-count returns the final node passCount for prefixes and whole words", () => {
  const words = ["do", "dog", "dot", "door"];
  assert.deepEqual(countTriePrefix(words, "d"), { normalizedPrefix: "d", count: 4 });
  assert.deepEqual(countTriePrefix(words, "do"), { normalizedPrefix: "do", count: 4 });
  assert.deepEqual(countTriePrefix(words, "dog"), { normalizedPrefix: "dog", count: 1 });
  assert.deepEqual(countTriePrefix(words, "door"), { normalizedPrefix: "door", count: 1 });
});

test("prefix-count includes duplicate insertions and shares createTrie aggregates", () => {
  const words = ["do", "DO", "dog", "do"];
  const result = countTriePrefix(words, "Do");
  const finalNode = createTrie(words).children.get("d").children.get("o");
  assert.deepEqual(result, { normalizedPrefix: "do", count: 4 });
  assert.equal(result.count, finalNode.passCount);
  assert.deepEqual(prefixCount(words, "do"), result);
});

test("prefix-count is case-insensitive and Unicode code-point aware", () => {
  const words = ["Caf\u00e9", "CAF\u00c9", "car", "cat"];
  assert.deepEqual(countTriePrefix(words, "CA"), { normalizedPrefix: "ca", count: 4 });
  assert.deepEqual(countTriePrefix(words, "CAF\u00c9"), { normalizedPrefix: "caf\u00e9", count: 2 });
});

test("prefix-count returns zero as soon as a normalized edge is missing", () => {
  assert.deepEqual(countTriePrefix(["ant", "and"], "ape"), {
    normalizedPrefix: "ape",
    count: 0
  });
  assert.deepEqual(countTriePrefix(["ant"], "ante"), {
    normalizedPrefix: "ante",
    count: 0
  });
});

test("prefix-count reuses trie validation and preserves its inputs", () => {
  const words = ["do", "dog"];
  const before = [...words];
  assert.deepEqual(countTriePrefix(words, "d"), { normalizedPrefix: "d", count: 2 });
  assert.deepEqual(words, before);

  for (const [invalidWords, invalidPrefix] of [
    [undefined, "a"],
    [[], "a"],
    [["a1"], "a"],
    [["a"], ""],
    [["a"], "a!"],
    [["a".repeat(maximumTrieTotalCharacters), "b"], "a"]
  ]) {
    assert.throws(() => countTriePrefix(invalidWords, invalidPrefix));
    assert.throws(() => validateTrieInput(invalidWords, invalidPrefix));
  }
});

test("prefix-count lesson parses the same bounded word and prefix language as L28", () => {
  assert.deepEqual(parsePrefixWords("do, dog, DO"), ["do", "dog", "DO"]);
  assert.throws(() => parsePrefixWords("do,,dog"));
  const parsed = prefixCountLesson.input.parse({ words: "do, dog, DO", prefix: "Do" });
  assert.deepEqual(parsed, { words: ["do", "dog", "DO"], prefix: "Do" });
  assert.deepEqual(prefixCountLesson.input.parse(prefixCountLesson.input.serialize(parsed)), parsed);
});

test("prefix-count trace follows the completed trie and annotates its aggregate", () => {
  const trace = buildPrefixCountTrace({ words: ["do", "dog", "dot", "DO"], prefix: "do" });
  assert.deepEqual(trace.map(({ phase }) => phase), [
    "initialize",
    "follow-prefix",
    "follow-prefix",
    "complete"
  ]);
  const complete = trace.at(-1);
  assert.deepEqual(complete.result, { normalizedPrefix: "do", count: 4 });
  assert.equal(complete.currentPassCount, 4);
  assert.equal(complete.view.annotations[0].label, "4 words pass here");
  assert.equal(complete.view.states.some(({ kind }) => kind === "aggregate"), true);
});

test("prefix-count trace stops on its first missing edge", () => {
  const trace = buildPrefixCountTrace({ words: ["ant", "and"], prefix: "ape" });
  const missing = trace.find(({ phase }) => phase === "missing-edge");
  assert.equal(missing.matchedCharacters, 1);
  assert.equal(missing.missingCharacter, "p");
  assert.equal(missing.count, 0);
  assert.equal(trace.some(({ phase, prefixIndex }) => phase === "follow-prefix" && prefixIndex === 2), false);
  assert.deepEqual(trace.at(-1).result, { normalizedPrefix: "ape", count: 0 });
});

test("prefix-count lesson satisfies deterministic branching ownership and full contract", () => {
  assert.equal(assertLesson(prefixCountLesson), prefixCountLesson);
  const input = structuredClone(prefixCountLesson.input.defaultValue);
  const trace = buildValidatedTrace(prefixCountLesson, input);
  assert.equal(assertTrace(trace, prefixCountLesson), trace);
  assert.deepEqual(input, prefixCountLesson.input.defaultValue);
  assert.deepEqual(trace.at(-1).result, { normalizedPrefix: "do", count: 5 });
  assert.equal(prefixCountLesson.order, 29);
  assert.deepEqual(prefixCountLesson.prerequisites, ["tries/trie-insert-search"]);
  assert.deepEqual(prefixCountLesson.patterns, ["trie", "prefix-count", "aggregation"]);

  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  const nodes = trace.flatMap((step) => step.view.nodes);
  assert.equal(new Set(nodes).size, nodes.length);
});

test("prefix-count trace rejects shared nested branching snapshots", () => {
  const trace = buildPrefixCountTrace({ words: ["do", "dog"], prefix: "do" });
  trace[1].view.edges = trace[0].view.edges;
  assert.throws(() => assertTrace(trace, prefixCountLesson), /edges snapshot/);
});
