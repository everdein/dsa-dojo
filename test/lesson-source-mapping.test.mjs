import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listLessons } from "../studio/src/lessons/index.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every lesson code pane references exact physical source lines", async () => {
  const mismatches = [];

  for (const lesson of listLessons()) {
    const sourceFile = path.resolve(projectRoot, ...lesson.code.sourcePath.split("/"));
    assert.ok(
      sourceFile.startsWith(`${projectRoot}${path.sep}`),
      `${lesson.id} sourcePath must stay inside the repository`
    );

    // Splitting on either newline spelling is the only normalization: leading
    // and trailing whitespace and every other source character stay exact.
    const sourceLines = (await readFile(sourceFile, "utf8")).split(/\r?\n/);
    for (const line of lesson.code.lines) {
      const sourceText = sourceLines[line.number - 1];
      if (line.text !== sourceText) {
        mismatches.push({
          lesson: lesson.id,
          sourcePath: lesson.code.sourcePath,
          line: line.number,
          expected: sourceText,
          actual: line.text
        });
      }
    }
  }

  assert.deepEqual(
    mismatches,
    [],
    `Found ${mismatches.length} stale lesson source mapping${mismatches.length === 1 ? "" : "s"}.`
  );
});
