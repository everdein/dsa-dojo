import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogFilterOptions,
  catalogFilterStateFromUrl,
  catalogFilterUrl,
  createCatalogFilterState,
  filterCatalogLessons,
  hasActiveCatalogFilters
} from "../studio/src/catalog-filters.mjs";

const lessons = [
  { id: "arrays/find-largest", order: 1, topic: "Arrays", catalogLabel: "Find Largest", catalogDescription: "Track one best value.", patterns: ["linear-scan"] },
  { id: "strings/valid-palindrome", order: 8, topic: "Strings", catalogLabel: "Valid Palindrome", catalogDescription: "Compare mirrored characters.", patterns: ["two-pointers", "normalization"] },
  { id: "searching/binary-search", order: 24, topic: "Searching", catalogLabel: "Binary Search", catalogDescription: "Halve a candidate range.", patterns: ["binary-search"] }
];

const progress = new Map([
  ["arrays/find-largest", "complete"],
  ["strings/valid-palindrome", "in-progress"],
  ["searching/binary-search", "not-started"]
]);

test("catalog filtering composes search, topic, pattern, and progress", () => {
  const status = (id) => progress.get(id);
  assert.deepEqual(filterCatalogLessons(lessons, { query: "mirrored" }, status).map(({ id }) => id), ["strings/valid-palindrome"]);
  assert.deepEqual(filterCatalogLessons(lessons, { query: "L24" }, status).map(({ id }) => id), ["searching/binary-search"]);
  assert.deepEqual(filterCatalogLessons(lessons, { topic: "Arrays", progress: "complete" }, status).map(({ id }) => id), ["arrays/find-largest"]);
  assert.deepEqual(filterCatalogLessons(lessons, { pattern: "two-pointers", progress: "started" }, status).map(({ id }) => id), ["strings/valid-palindrome"]);
  assert.deepEqual(filterCatalogLessons(lessons, { progress: "not-started" }, status).map(({ id }) => id), ["searching/binary-search"]);
});

test("filter state normalizes input and round trips through query parameters", () => {
  const state = createCatalogFilterState({ query: "  binary   search ", topic: "Searching", pattern: "binary-search", progress: "complete" });
  assert.deepEqual(state, { query: "binary search", topic: "Searching", pattern: "binary-search", progress: "complete" });
  const url = catalogFilterUrl("https://example.test/studio/?old=kept#lesson=searching%2Fbinary-search", state);
  assert.equal(url.searchParams.get("old"), "kept");
  assert.equal(url.hash, "#lesson=searching%2Fbinary-search");
  assert.deepEqual(catalogFilterStateFromUrl(url), state);
  assert.equal(hasActiveCatalogFilters(state), true);
  assert.equal(hasActiveCatalogFilters(createCatalogFilterState()), false);
});

test("catalog options preserve topic order and sort unique patterns", () => {
  assert.deepEqual(catalogFilterOptions(lessons), {
    topics: ["Arrays", "Strings", "Searching"],
    patterns: ["binary-search", "linear-scan", "normalization", "two-pointers"]
  });
});

test("invalid filter values fall back safely", () => {
  assert.deepEqual(catalogFilterStateFromUrl("/studio/?progress=invented"), createCatalogFilterState());
  assert.throws(() => filterCatalogLessons(null, {}), /lesson array/);
  assert.throws(() => catalogFilterOptions(null), /lesson array/);
});
