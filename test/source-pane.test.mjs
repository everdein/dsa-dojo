import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSourceLines, sourceModuleUrl } from "../studio/src/source-pane.mjs";
import { listLessons } from "../studio/src/lessons/index.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("source panes derive current physical lines for every lesson", async () => {
  for (const lesson of listLessons()) {
    const source = await readFile(path.resolve(projectRoot, ...lesson.code.sourcePath.split("/")), "utf8");
    const derived = deriveSourceLines(source, lesson.code.lines);
    const physical = source.split(/\r?\n/u);
    for (const line of derived) assert.equal(line.text, physical[line.number - 1]);
  }
});

test("source derivation follows ordered anchors after unrelated lines shift", () => {
  const source = ["// inserted", "function run() {", "  work();", "}", ""].join("\n");
  assert.deepEqual(deriveSourceLines(source, [
    { number: 1, text: "function run() {", steps: ["start"] },
    { number: 2, text: "  work();", steps: ["work"] },
    { number: 3, text: "}", steps: ["end"] }
  ]).map(({ number, text }) => ({ number, text })), [
    { number: 2, text: "function run() {" },
    { number: 3, text: "  work();" },
    { number: 4, text: "}" }
  ]);
  assert.throws(() => deriveSourceLines("different();", [{ number: 1, text: "missing();", steps: ["x"] }]), /anchor is missing/);
});

test("source module URLs stay inside the repository-relative module tree", () => {
  assert.equal(
    sourceModuleUrl("arrays/find-largest.mjs", "https://example.test/dsa-dojo/studio/src/source-pane.mjs").href,
    "https://example.test/dsa-dojo/arrays/find-largest.mjs"
  );
  assert.throws(() => sourceModuleUrl("../secret.mjs"), /Unsafe/);
});
