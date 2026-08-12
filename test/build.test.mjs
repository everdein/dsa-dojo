import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { curriculumModulePaths } from "../studio/src/curriculum-manifest.mjs";

const run = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");

test("static build keeps every browser module inside the Pages artifact", async () => {
  await run(process.execPath, ["scripts/build-static.mjs"], { cwd: projectRoot });

  const entries = await Promise.all([
    readModuleEntry(path.join(outputRoot, "index.html")),
    readModuleEntry(path.join(outputRoot, "studio", "index.html"))
  ]);

  assert.equal(
    path.relative(outputRoot, entries[0]),
    path.join("studio", "src", "home.mjs")
  );
  assert.equal(
    path.relative(outputRoot, entries[1]),
    path.join("studio", "src", "app.mjs")
  );

  const visited = new Set();
  for (const entry of entries) await assertModuleGraphStaysInArtifact(entry, visited);

  for (const modulePath of curriculumModulePaths) {
    await access(path.join(outputRoot, ...modulePath.split("/")));
  }
});

async function readModuleEntry(htmlPath) {
  const html = await readFile(htmlPath, "utf8");
  const match = html.match(/<script\s+type="module"\s+src="([^"]+)"/);
  assert.ok(match, `Expected a module entry in ${path.relative(outputRoot, htmlPath)}`);

  const entryPath = path.resolve(path.dirname(htmlPath), match[1]);
  assertInsideArtifact(entryPath, htmlPath);
  await access(entryPath);
  return entryPath;
}

async function assertModuleGraphStaysInArtifact(modulePath, visited) {
  if (visited.has(modulePath)) return;
  visited.add(modulePath);

  const source = await readFile(modulePath, "utf8");
  const imports = [...source.matchAll(/(?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g)];

  for (const [, , specifier] of imports) {
    const dependency = path.resolve(path.dirname(modulePath), specifier);
    assertInsideArtifact(dependency, modulePath);
    await access(dependency);
    await assertModuleGraphStaysInArtifact(dependency, visited);
  }
}

function assertInsideArtifact(candidate, importer) {
  assert.ok(
    candidate.startsWith(`${outputRoot}${path.sep}`),
    `${path.relative(projectRoot, importer)} resolves outside dist: ${candidate}`
  );
}
