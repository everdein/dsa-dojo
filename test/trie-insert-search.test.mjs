import test from "node:test";
import assert from "node:assert/strict";
import {
  createTrie,
  maximumTrieTotalCharacters,
  normalizeTrieWord,
  searchTrie,
  validateTrieInput
} from "../tries/trie-insert-search.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import {
  parseTrieWords,
  trieInsertSearchLesson
} from "../studio/src/lessons/trie-insert-search.mjs";
import { buildTrieInsertSearchTrace } from "../studio/src/trie-insert-search.mjs";

test("trie insert/search distinguishes words, prefixes, and missing paths", () => {
  const words = ["do", "dog", "dot"];
  assert.deepEqual(searchTrie(words, "dog"), { found: true, isPrefix: true, normalizedQuery: "dog" });
  assert.deepEqual(searchTrie(words, "d"), { found: false, isPrefix: true, normalizedQuery: "d" });
  assert.deepEqual(searchTrie(words, "door"), { found: false, isPrefix: false, normalizedQuery: "door" });
  assert.deepEqual(searchTrie(words, "DO"), { found: true, isPrefix: true, normalizedQuery: "do" });
});

test("trie normalization is Unicode code-point aware and deterministic", () => {
  assert.equal(normalizeTrieWord("CAFÉ"), "café");
  assert.deepEqual(searchTrie(["Café", "Car"], "CAFÉ"), {
    found: true,
    isPrefix: true,
    normalizedQuery: "café"
  });
});

test("trie validation rejects malformed, nonletter, and oversized inputs", () => {
  for (const [words, query] of [
    [undefined, "a"],
    [[], "a"],
    [["a1"], "a"],
    [["a"], ""],
    [["a"], "a!"],
    [["a".repeat(13)], "a"],
    [["a".repeat(maximumTrieTotalCharacters), "b"], "a"]
  ]) {
    assert.throws(() => validateTrieInput(words, query));
  }
});

test("trie construction reuses shared prefix nodes", () => {
  const root = createTrie(["do", "dog", "dot"]);
  const d = root.children.get("d");
  const o = d.children.get("o");
  assert.equal(root.children.size, 1);
  assert.equal(o.terminal, true);
  assert.deepEqual([...o.children.keys()], ["g", "t"]);
});

test("trie lesson parses words and traces create, reuse, terminal, and query phases", () => {
  assert.deepEqual(parseTrieWords("do, dog, dot"), ["do", "dog", "dot"]);
  assert.throws(() => parseTrieWords("do,,dot"));
  const trace = buildTrieInsertSearchTrace(trieInsertSearchLesson.input.defaultValue);
  for (const phase of ["create-edge", "reuse-edge", "mark-word", "follow-query", "complete"]) {
    assert.ok(trace.some((step) => step.phase === phase), phase);
  }
  assert.deepEqual(trace.at(-1).result, searchTrie(["do", "dog", "dot"], "dog"));
});

test("trie lesson satisfies deterministic branching snapshot ownership", () => {
  const trace = buildValidatedTrace(trieInsertSearchLesson, trieInsertSearchLesson.input.defaultValue);
  for (const property of ["nodes", "edges", "rootIds", "activeNodeIds", "changedNodeIds", "states", "annotations", "pointers"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  assert.equal(new Set(trace.flatMap((step) => step.view.nodes)).size, trace.flatMap((step) => step.view.nodes).length);
});
