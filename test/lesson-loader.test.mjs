import test from "node:test";
import assert from "node:assert/strict";
import { curriculumLessons } from "../studio/src/curriculum-manifest.mjs";
import {
  clearLessonLoaderCache,
  lessonIds,
  loadLesson,
  loadedLesson,
  preloadLessons
} from "../studio/src/lesson-loader.mjs";

test("lesson loader resolves manifest modules lazily and caches one validated definition", async () => {
  clearLessonLoaderCache();
  let imports = 0;
  const definition = {
    id: "arrays/find-largest",
    renderer: "array",
    title: "x",
    summary: "x",
    input: {
      fields: [{ id: "values", label: "Values", type: "text" }],
      parse: () => ({ values: [1] }),
      serialize: () => ({ values: "1" }),
      defaultValue: { values: [1] },
      sampleValue: { values: [2] }
    },
    solve: () => 1,
    buildTrace: () => [],
    code: { title: "x", filename: "find-largest.mjs", sourcePath: "arrays/find-largest.mjs", lines: [{ number: 1, text: "x", steps: ["x"] }] },
    stats: [{ label: "x", value: () => "x" }],
    complexity: { chip: "x", time: "x", space: "x", explanation: "x" },
    guide: { heading: "x" },
    legend: [{ kind: "active", label: "x" }],
    reflection: { eyebrow: "x", title: "x", body: "x" }
  };
  const importer = async (path) => {
    imports += 1;
    assert.equal(path, "studio/src/lessons/find-largest.mjs");
    return { findLargestLesson: definition };
  };
  const first = loadLesson(definition.id, importer);
  assert.equal(loadedLesson(definition.id), first);
  const [lesson, sameLesson] = await Promise.all([first, loadLesson(definition.id, importer)]);
  assert.equal(lesson, sameLesson);
  assert.equal(imports, 1);
  assert.equal(lesson.order, 1);
});

test("real lesson modules load on demand and the manifest remains the catalog", async () => {
  clearLessonLoaderCache();
  assert.deepEqual(lessonIds, curriculumLessons.map(({ id }) => id));
  assert.equal(loadedLesson("arrays/find-largest"), null);
  const [first, second] = await preloadLessons(["arrays/find-largest", "strings/valid-palindrome"]);
  assert.equal(first.id, "arrays/find-largest");
  assert.equal(second.id, "strings/valid-palindrome");
  assert.ok(loadedLesson(first.id));
  assert.equal(loadedLesson("sorting/quick-sort"), null);
});
