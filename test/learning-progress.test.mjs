import assert from "node:assert/strict";
import test from "node:test";

import {
  clearLearningProgress,
  createLearningProgress,
  learningProgressStorageKey,
  learningProgressSummary,
  lessonProgressState,
  readLearningProgress,
  recordLearningSession,
  sanitizeLearningProgress,
  writeLearningProgress
} from "../studio/src/learning-progress.mjs";

const curriculum = [
  { id: "arrays/find-largest", topic: "Arrays" },
  { id: "arrays/reverse-array", topic: "Arrays" },
  { id: "strings/valid-palindrome", topic: "Strings" }
];

test("learning progress records resumable sessions and keeps completion durable", () => {
  let progress = recordLearningSession(createLearningProgress(), {
    lessonId: "arrays/find-largest",
    input: { values: [4, 1, 7] },
    stepIndex: 2,
    traceLength: 4,
    completed: false,
    updatedAt: "2026-08-13T12:00:00.000Z"
  }, curriculum);

  assert.equal(progress.lastLessonId, "arrays/find-largest");
  assert.deepEqual(lessonProgressState(progress, "arrays/find-largest"), {
    status: "in-progress",
    label: "Step 2 of 3",
    session: progress.lessons["arrays/find-largest"]
  });

  progress = recordLearningSession(progress, {
    lessonId: "arrays/find-largest",
    input: { values: [4, 1, 7] },
    stepIndex: 3,
    traceLength: 4,
    completed: true,
    updatedAt: "2026-08-13T12:01:00.000Z"
  }, curriculum);
  progress = recordLearningSession(progress, {
    lessonId: "arrays/find-largest",
    input: { values: [4, 1, 7] },
    stepIndex: 1,
    traceLength: 4,
    completed: false,
    updatedAt: "2026-08-13T12:02:00.000Z"
  }, curriculum);

  assert.equal(lessonProgressState(progress, "arrays/find-largest").status, "complete");
  assert.deepEqual(learningProgressSummary(progress, curriculum), {
    completed: 1,
    total: 3,
    percent: 33,
    completedIds: new Set(["arrays/find-largest"]),
    lastLessonId: "arrays/find-largest"
  });
});

test("progress sanitization rejects stale lessons and clamps malformed positions", () => {
  const sanitized = sanitizeLearningProgress({
    version: 99,
    lastLessonId: "removed/lesson",
    lessons: {
      "arrays/find-largest": {
        completed: "yes",
        stepIndex: 99,
        traceLength: 4,
        input: { values: [1, 2, 3] },
        updatedAt: "not-a-date"
      },
      "removed/lesson": { completed: true, stepIndex: 1, traceLength: 2 }
    }
  }, curriculum);

  assert.equal(sanitized.lastLessonId, null);
  assert.deepEqual(sanitized.lessons["arrays/find-largest"], {
    completed: false,
    stepIndex: 3,
    traceLength: 4,
    input: { values: [1, 2, 3] },
    updatedAt: null
  });
  assert.equal(sanitized.lessons["removed/lesson"], undefined);
});

test("storage adapter round trips safely and degrades when browser storage is blocked", () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
  const progress = recordLearningSession(createLearningProgress(), {
    lessonId: "strings/valid-palindrome",
    input: { text: "Never odd or even" },
    stepIndex: 1,
    traceLength: 8,
    completed: false,
    updatedAt: "2026-08-13T12:00:00.000Z"
  }, curriculum);

  writeLearningProgress(storage, progress, curriculum);
  assert.ok(values.has(learningProgressStorageKey));
  assert.deepEqual(readLearningProgress(storage, curriculum), progress);
  assert.deepEqual(clearLearningProgress(storage), createLearningProgress());
  assert.equal(values.has(learningProgressStorageKey), false);

  const blockedStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); }
  };
  assert.deepEqual(readLearningProgress(blockedStorage, curriculum), createLearningProgress());
  assert.doesNotThrow(() => writeLearningProgress(blockedStorage, progress, curriculum));
  assert.doesNotThrow(() => clearLearningProgress(blockedStorage));
});

test("unknown lessons cannot enter local progress", () => {
  const progress = recordLearningSession(createLearningProgress(), {
    lessonId: "unknown/lesson",
    input: {},
    stepIndex: 1,
    traceLength: 2,
    completed: true
  }, curriculum);
  assert.deepEqual(progress, createLearningProgress());
  assert.deepEqual(lessonProgressState(progress, "arrays/reverse-array"), {
    status: "not-started",
    label: "Not started",
    session: null
  });
});
