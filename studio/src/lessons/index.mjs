import { assertLesson, buildValidatedTrace } from "../lesson-contract.mjs";
import { findLargestLesson } from "./find-largest.mjs";
import { slidingWindowLesson } from "./sliding-window.mjs";

const lessons = [findLargestLesson, slidingWindowLesson]
  .sort((left, right) => left.order - right.order)
  .map(assertLesson);

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
if (lessonById.size !== lessons.length) throw new Error("Lesson ids must be unique.");

for (const lesson of lessons) {
  buildValidatedTrace(lesson, lesson.input.defaultValue);
}

export function listLessons() {
  return [...lessons];
}

export function getLesson(id) {
  const lesson = lessonById.get(id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}
