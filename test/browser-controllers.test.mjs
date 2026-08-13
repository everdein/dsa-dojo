import test from "node:test";
import assert from "node:assert/strict";
import { createPlaybackClock, getBrowserStorage } from "../studio/src/browser-runtime.mjs";
import {
  persistLessonSession,
  restoreLessonPlayer,
  restoreLessonState,
  restoreSharedLessonPlayer
} from "../studio/src/lesson-session.mjs";
import { createLearningProgress } from "../studio/src/learning-progress.mjs";
import { createShareController } from "../studio/src/share-controller.mjs";
import { createLessonShareState } from "../studio/src/shareable-state.mjs";

const lesson = {
  id: "topic/example",
  input: {
    defaultValue: { value: 1 },
    parse: ({ value }) => ({ value: Number(value) })
  }
};

function buildTrace(_lesson, input) {
  if (!Number.isFinite(input.value)) throw new Error("invalid input");
  return [
    { step: 0, phase: "initialize", result: null },
    { step: 1, phase: "complete", result: input.value }
  ];
}

test("lesson sessions restore saved and shared state with bounded fallback", () => {
  const progress = {
    version: 1,
    lastLessonId: lesson.id,
    lessons: { [lesson.id]: { input: { value: 4 }, stepIndex: 99 } }
  };
  assert.deepEqual(restoreLessonState(lesson, progress, buildTrace), {
    input: { value: 4 },
    trace: buildTrace(lesson, { value: 4 }),
    stepIndex: 1
  });
  assert.equal(restoreLessonPlayer(lesson, progress, buildTrace).index, 1);

  const shared = restoreSharedLessonPlayer(lesson, {
    lessonId: lesson.id,
    fields: { value: "8" },
    stepIndex: 1
  }, progress, buildTrace);
  assert.equal(shared.error, null);
  assert.equal(shared.player.input.value, 8);
  assert.equal(shared.player.index, 1);

  const invalid = restoreSharedLessonPlayer(lesson, {
    lessonId: "topic/other",
    fields: { value: "8" },
    stepIndex: 1
  }, progress, buildTrace);
  assert.match(invalid.error, /does not match/);
  assert.equal(invalid.player.input.value, 4);
});

test("lesson session persistence delegates sanitized local progress writes", () => {
  const writes = new Map();
  const storage = { setItem: (key, value) => writes.set(key, value) };
  const player = { input: { value: 5 }, index: 1, trace: buildTrace(lesson, { value: 5 }), status: "complete" };
  const progress = persistLessonSession({
    progress: createLearningProgress(),
    lesson,
    player,
    lessons: [lesson],
    storage,
    now: new Date("2026-01-02T03:04:05.000Z")
  });
  assert.equal(progress.lessons[lesson.id].completed, true);
  assert.equal(progress.lessons[lesson.id].updatedAt, "2026-01-02T03:04:05.000Z");
  assert.equal(writes.size, 1);
});

test("browser runtime isolates storage failures and owns one playback timer", () => {
  assert.equal(getBrowserStorage({ get localStorage() { throw new Error("blocked"); } }), null);
  const calls = [];
  const browserWindow = {
    localStorage: { name: "storage" },
    setInterval(callback, delay) { calls.push(["start", callback, delay]); return 7; },
    clearInterval(id) { calls.push(["stop", id]); }
  };
  assert.equal(getBrowserStorage(browserWindow).name, "storage");
  const clock = createPlaybackClock(browserWindow);
  const tick = () => {};
  clock.start(tick, 250);
  assert.equal(clock.isRunning(), true);
  clock.start(tick, 500);
  clock.stop();
  assert.deepEqual(calls.map(([event, , delay]) => [event, delay]), [
    ["start", 250], ["stop", undefined], ["start", 500], ["stop", undefined]
  ]);
  assert.equal(clock.isRunning(), false);
});

test("share controller owns URL cleanup, clipboard sharing, and restore notices", async () => {
  const replaced = [];
  const copied = [];
  const status = { textContent: "restored" };
  const notice = { hidden: true };
  const noticeCopy = { textContent: "" };
  const browserWindow = {
    location: {
      href: "https://example.test/studio/?share=old#lesson=topic%2Fexample",
      pathname: "/studio/",
      origin: "https://example.test"
    },
    history: { replaceState: (_state, _title, url) => replaced.push(url) }
  };
  const controller = createShareController({
    browserWindow,
    browserDocument: {},
    browserNavigator: { clipboard: { writeText: async (url) => copied.push(url) } },
    elements: { status, notice, noticeCopy },
    getSnapshot: () => ({
      title: "Example",
      state: createLessonShareState({ lessonId: lesson.id, fields: { value: "5" }, stepIndex: 1 })
    })
  });

  controller.clearUrlState();
  assert.deepEqual(replaced, ["/studio/#lesson=topic%2Fexample"]);
  assert.equal(status.textContent, "");
  controller.renderRestoreNotice("bad link");
  assert.equal(notice.hidden, false);
  assert.equal(noticeCopy.textContent, "bad link");
  await controller.shareCurrentState();
  assert.match(copied[0], /^https:\/\/example\.test\/studio\/\?share=/);
  assert.match(copied[0], /#lesson=topic%2Fexample$/);
  assert.equal(status.textContent, "Link copied — input and step included.");
});
