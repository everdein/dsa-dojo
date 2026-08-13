import test from "node:test";
import assert from "node:assert/strict";
import { curriculumLessons } from "../studio/src/curriculum-manifest.mjs";
import { buildCurriculumMap, curriculumMapSelection } from "../studio/src/curriculum-map.mjs";

test("curriculum map projects every lesson into ordered prerequisite stages", () => {
  const map = buildCurriculumMap(curriculumLessons);
  assert.equal(map.nodes.length, 55);
  assert.equal(map.columns.flat().length, 55);
  assert.equal(map.edges.length, curriculumLessons.reduce((total, lesson) => total + lesson.prerequisites.length, 0));
  assert.deepEqual(map.nodes.map(({ id }) => id), curriculumLessons.map(({ id }) => id));

  for (const edge of map.edges) {
    assert.ok(map.nodeById.get(edge.source).depth < map.nodeById.get(edge.target).depth);
  }
  for (const node of map.nodes) {
    assert.deepEqual(
      node.dependents,
      curriculumLessons.filter(({ prerequisites }) => prerequisites.includes(node.id)).map(({ id }) => id)
    );
  }
});

test("curriculum map selection identifies the immediate path and pattern matches", () => {
  const map = buildCurriculumMap(curriculumLessons);
  const selection = curriculumMapSelection(map, "queues/sliding-window-maximum", "sliding-window");
  assert.deepEqual(selection.prerequisiteIds, ["arrays/sliding-window", "queues/queue-operations"]);
  assert.ok(selection.matchingPatternIds.includes("arrays/sliding-window"));
  assert.ok(selection.matchingPatternIds.includes("queues/sliding-window-maximum"));
  assert.equal(selection.activeEdgeIds.length, 2);
  assert.throws(() => curriculumMapSelection(map, "missing"), /Unknown curriculum map lesson/);
});

test("curriculum map rejects missing links, cycles, duplicate ids, and malformed input", () => {
  const base = {
    order: 1,
    topic: "Topic",
    catalogLabel: "Lesson",
    catalogDescription: "Description",
    patterns: ["pattern"]
  };
  assert.throws(() => buildCurriculumMap([]), /non-empty lesson array/);
  assert.throws(() => buildCurriculumMap([
    { ...base, id: "one", prerequisites: ["missing"] }
  ]), /missing prerequisite/);
  assert.throws(() => buildCurriculumMap([
    { ...base, id: "one", prerequisites: ["two"] },
    { ...base, id: "two", order: 2, prerequisites: ["one"] }
  ]), /cycle/);
  assert.throws(() => buildCurriculumMap([
    { ...base, id: "one", prerequisites: [] },
    { ...base, id: "one", order: 2, prerequisites: [] }
  ]), /Duplicate curriculum lesson/);
});
