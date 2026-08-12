import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  curriculumLessons,
  curriculumModulePaths,
  getCurriculumLesson
} from "../studio/src/curriculum-manifest.mjs";
import { listLessons } from "../studio/src/lessons/index.mjs";
import { resolveRequest } from "../studio/server.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("curriculum manifest is ordered, immutable, and complete for catalog metadata", () => {
  assert.equal(curriculumLessons.length, 55);
  assert.deepEqual(
    curriculumLessons.map((lesson) => lesson.order),
    curriculumLessons.map((_, index) => index + 1)
  );
  assert.equal(new Set(curriculumLessons.map((lesson) => lesson.id)).size, curriculumLessons.length);
  assert.equal(new Set(curriculumModulePaths).size, curriculumModulePaths.length);

  const ids = new Set(curriculumLessons.map((lesson) => lesson.id));
  for (const lesson of curriculumLessons) {
    assert.equal(getCurriculumLesson(lesson.id), lesson);
    assert.ok(lesson.topic);
    assert.ok(lesson.catalogLabel);
    assert.ok(lesson.catalogDescription);
    assert.ok(lesson.lessonModule.startsWith("studio/src/lessons/"));
    assert.ok(lesson.patterns.length > 0);
    assert.ok(lesson.prerequisites.every((id) => ids.has(id)));
    assert.ok(Object.isFrozen(lesson));
    assert.ok(Object.isFrozen(lesson.prerequisites));
    assert.ok(Object.isFrozen(lesson.patterns));
    assert.ok(Object.isFrozen(lesson.runtimeModules));
  }

  assert.throws(() => getCurriculumLesson("missing"), /Unknown curriculum lesson/);
});

test("registered lessons agree with their lightweight curriculum metadata", () => {
  const registeredLessons = listLessons();
  assert.equal(registeredLessons.length, curriculumLessons.length);

  for (const lesson of registeredLessons) {
    const manifestLesson = getCurriculumLesson(lesson.id);
    assert.deepEqual(
      {
        id: lesson.id,
        order: lesson.order,
        topic: lesson.topic,
        catalogLabel: lesson.catalogLabel,
        catalogDescription: lesson.catalogDescription
      },
      {
        id: manifestLesson.id,
        order: manifestLesson.order,
        topic: manifestLesson.topic,
        catalogLabel: manifestLesson.catalogLabel,
        catalogDescription: manifestLesson.catalogDescription
      }
    );
  }
});

test("runtime-module declarations include each lesson's transitive domain imports", async () => {
  for (const lesson of curriculumLessons) {
    for (const modulePath of lesson.runtimeModules) {
      assert.ok(curriculumModulePaths.includes(modulePath));
      await access(fromRepoPath(modulePath));
    }

    const lessonPath = fromRepoPath(lesson.lessonModule);
    if (!await exists(lessonPath)) continue;

    const externalImports = await collectExternalImports(lessonPath);
    assert.deepEqual(
      [...externalImports].sort(),
      [...lesson.runtimeModules].sort(),
      `${lesson.id} runtimeModules must match its transitive domain imports`
    );
  }
});

test("the development server serves every declared runtime module and rejects undeclared modules", () => {
  for (const modulePath of curriculumModulePaths) {
    assert.equal(resolveRequest(`/${modulePath}`), fromRepoPath(modulePath));
  }

  assert.equal(resolveRequest("/arrays/is-sorted.mjs"), null);
  assert.equal(resolveRequest("/strings/README.md"), null);
});

async function collectExternalImports(entryPath, visited = new Set(), external = new Set()) {
  if (visited.has(entryPath)) return external;
  visited.add(entryPath);

  const source = await readFile(entryPath, "utf8");
  const imports = [...source.matchAll(/(?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/g)];
  for (const [, , specifier] of imports) {
    const dependency = path.resolve(path.dirname(entryPath), specifier);
    if (!isInsideProject(dependency)) {
      throw new Error(`${toRepoPath(entryPath)} imports outside the project: ${specifier}`);
    }
    if (!isInsideStudioSource(dependency)) external.add(toRepoPath(dependency));
    await collectExternalImports(dependency, visited, external);
  }
  return external;
}

function fromRepoPath(modulePath) {
  return path.resolve(projectRoot, ...modulePath.split("/"));
}

function toRepoPath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function isInsideProject(filePath) {
  return filePath.startsWith(`${projectRoot}${path.sep}`);
}

function isInsideStudioSource(filePath) {
  const sourceRoot = path.join(projectRoot, "studio", "src");
  return filePath.startsWith(`${sourceRoot}${path.sep}`);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
