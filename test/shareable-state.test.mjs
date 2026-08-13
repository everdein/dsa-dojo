import test from "node:test";
import assert from "node:assert/strict";
import {
  createComparisonShareState,
  createLessonShareState,
  decodeShareState,
  encodeShareState,
  readShareStateFromUrl,
  removeShareStateFromUrl,
  shareStateUrl
} from "../studio/src/shareable-state.mjs";

test("lesson share states round trip Unicode input and exact step through a URL", () => {
  const state = createLessonShareState({
    lessonId: "strings/valid-palindrome",
    fields: { text: "À man, a plan 👀" },
    stepIndex: 7
  });
  assert.deepEqual(decodeShareState(encodeShareState(state)), state);
  const url = shareStateUrl("https://example.test/studio/?q=old#catalog", state);
  assert.equal(url.hash, "#lesson=strings%2Fvalid-palindrome");
  assert.deepEqual(readShareStateFromUrl(url), { state, error: null });
  assert.equal(removeShareStateFromUrl(url).searchParams.has("share"), false);
});

test("comparison share states preserve pair, shared input, and independent positions", () => {
  const state = createComparisonShareState({
    familyId: "sorting-strategies",
    leftLessonId: "sorting/bubble-sort",
    rightLessonId: "sorting/merge-sort",
    fields: { values: "5, 1, 4, 2" },
    leftIndex: 3,
    rightIndex: 8
  });
  const url = shareStateUrl("/studio/", state);
  assert.equal(url.hash, "#comparison");
  assert.deepEqual(readShareStateFromUrl(url).state, state);
});

test("share decoding fails safely for corruption, unsupported versions, and invalid shapes", () => {
  assert.deepEqual(readShareStateFromUrl("/studio/"), { state: null, error: null });
  assert.match(readShareStateFromUrl("/studio/?share=not_valid!").error, /invalid format/);
  assert.throws(() => createLessonShareState({ lessonId: "bad id", fields: { x: "1" }, stepIndex: 0 }), /invalid lesson/);
  assert.throws(() => createComparisonShareState({
    familyId: "sorting-strategies",
    leftLessonId: "sorting/bubble-sort",
    rightLessonId: "sorting/bubble-sort",
    fields: { values: "1" },
    leftIndex: 0,
    rightIndex: 0
  }), /repeats one algorithm/);
  const unsupported = btoa(JSON.stringify({ v: 99, kind: "lesson", lessonId: "arrays/find-largest", fields: { values: "1" }, stepIndex: 0 }))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  assert.match(readShareStateFromUrl(`/studio/?share=${unsupported}`).error, /unsupported version/);
});
