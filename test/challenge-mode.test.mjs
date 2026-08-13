import assert from "node:assert/strict";
import test from "node:test";

import {
  answerChallenge,
  buildChallengeQuestion,
  challengeModeStorageKey,
  challengeSummary,
  createChallengePreferences,
  createChallengeSession,
  readChallengePreferences,
  recordChallengeBest,
  sanitizeChallengePreferences,
  setChallengePreference,
  skipChallenge,
  writeChallengePreferences
} from "../studio/src/challenge-mode.mjs";
import { buildValidatedTrace } from "../studio/src/lesson-contract.mjs";
import { listLessons } from "../studio/src/lessons/index.mjs";

const curriculum = [{ id: "arrays/find-largest" }, { id: "strings/valid-palindrome" }];
const trace = [
  { narration: "Start with 1.", prompt: "What should happen next?" },
  { narration: "Compare 4 and keep 4." },
  { narration: "Return 4." }
];

test("challenge questions are deterministic, unique, and identify the real next trace state", () => {
  const question = buildChallengeQuestion("arrays/find-largest", trace, 0);
  assert.deepEqual(question, buildChallengeQuestion("arrays/find-largest", trace, 0));
  assert.equal(question.targetIndex, 1);
  assert.equal(question.total, 2);
  assert.equal(question.options.length, 3);
  assert.equal(new Set(question.options.map(({ text }) => text)).size, 3);
  assert.equal(question.options.find(({ id }) => id === question.correctOptionId).text, trace[1].narration);
  assert.equal(buildChallengeQuestion("arrays/find-largest", trace, 2), null);
});

test("every registered lesson produces valid questions for every state transition", () => {
  for (const lesson of listLessons()) {
    const lessonTrace = buildValidatedTrace(lesson, structuredClone(lesson.input.defaultValue));
    for (let index = 0; index < lessonTrace.length - 1; index += 1) {
      const question = buildChallengeQuestion(lesson.id, lessonTrace, index);
      assert.equal(question.options.length, 3, `${lesson.id} step ${index}`);
      assert.equal(new Set(question.options.map(({ text }) => text)).size, 3, `${lesson.id} step ${index}`);
      assert.ok(question.options.some(({ id }) => id === question.correctOptionId), `${lesson.id} step ${index}`);
    }
  }
});

test("first answers, skips, accuracy, and streaks are scored without mutation", () => {
  const original = createChallengeSession("arrays/find-largest", trace);
  const first = buildChallengeQuestion("arrays/find-largest", trace, 0);
  const correct = answerChallenge(original, first, first.correctOptionId);
  assert.deepEqual(challengeSummary(correct), {
    correct: 1, answered: 1, skipped: 0, total: 2, bestStreak: 1, accuracy: 100, complete: false
  });
  assert.deepEqual(challengeSummary(original), {
    correct: 0, answered: 0, skipped: 0, total: 2, bestStreak: 0, accuracy: 0, complete: false
  });
  assert.deepEqual(answerChallenge(correct, first, first.options.find(({ id }) => id !== first.correctOptionId).id), correct);

  const second = buildChallengeQuestion("arrays/find-largest", trace, 1);
  const completed = skipChallenge(correct, second);
  assert.deepEqual(challengeSummary(completed), {
    correct: 1, answered: 1, skipped: 1, total: 2, bestStreak: 1, accuracy: 100, complete: true
  });
});

test("challenge preferences persist safely and retain the stronger personal best", () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); }
  };
  let preferences = setChallengePreference(createChallengePreferences(), true, curriculum);
  preferences = recordChallengeBest(preferences, "arrays/find-largest", {
    correct: 1, answered: 2, skipped: 0, total: 2, bestStreak: 1,
    completedAt: "2026-08-13T12:00:00.000Z"
  }, curriculum);
  preferences = recordChallengeBest(preferences, "arrays/find-largest", {
    correct: 2, answered: 2, skipped: 0, total: 2, bestStreak: 2,
    completedAt: "2026-08-13T12:01:00.000Z"
  }, curriculum);
  writeChallengePreferences(storage, preferences, curriculum);

  assert.ok(values.has(challengeModeStorageKey));
  assert.deepEqual(readChallengePreferences(storage, curriculum), preferences);
  assert.equal(preferences.bestByLesson["arrays/find-largest"].correct, 2);
  assert.equal(preferences.bestByLesson["arrays/find-largest"].completedAt, "2026-08-13T12:01:00.000Z");
});

test("malformed challenge preferences are bounded to the current curriculum", () => {
  assert.deepEqual(sanitizeChallengePreferences({
    enabled: "yes",
    bestByLesson: {
      "arrays/find-largest": { correct: 9, answered: 2, skipped: 9, total: 2, bestStreak: 8 },
      "removed/lesson": { correct: 1, answered: 1, total: 1 }
    }
  }, curriculum), {
    version: 1,
    enabled: false,
    bestByLesson: {
      "arrays/find-largest": {
        correct: 2, answered: 2, skipped: 0, total: 2, bestStreak: 2, completedAt: null
      }
    }
  });
});
