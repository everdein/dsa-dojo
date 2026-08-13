import { curriculumLessons, getCurriculumLesson } from "./curriculum-manifest.mjs";
import { assertLesson } from "./lesson-contract.mjs";

const lessonPromises = new Map();
const sourcePrefix = "studio/src/";

export function loadLesson(id, importer = importLessonModule) {
  const metadata = getCurriculumLesson(id);
  if (!lessonPromises.has(id)) {
    lessonPromises.set(id, Promise.resolve(importer(metadata.lessonModule)).then((module) => {
      const definition = Object.values(module).find((value) => value?.id === id);
      if (!definition) throw new Error(`Lesson module does not export its declared lesson: ${id}`);
      return assertLesson(withCurriculumMetadata(definition, metadata));
    }).catch((error) => {
      lessonPromises.delete(id);
      throw error;
    }));
  }
  return lessonPromises.get(id);
}

export function preloadLessons(ids) {
  return Promise.all(ids.map((id) => loadLesson(id)));
}

export function loadedLesson(id) {
  return lessonPromises.get(id) ?? null;
}

export function clearLessonLoaderCache() {
  lessonPromises.clear();
}

async function importLessonModule(modulePath) {
  if (!modulePath.startsWith(sourcePrefix)) throw new Error(`Unsafe lesson module path: ${modulePath}`);
  return import(`./${modulePath.slice(sourcePrefix.length)}`);
}

function withCurriculumMetadata(definition, metadata) {
  return {
    ...definition,
    order: metadata.order,
    topic: metadata.topic,
    catalogLabel: metadata.catalogLabel,
    catalogDescription: metadata.catalogDescription,
    prerequisites: [...metadata.prerequisites],
    patterns: [...metadata.patterns]
  };
}

export const lessonIds = Object.freeze(curriculumLessons.map(({ id }) => id));
