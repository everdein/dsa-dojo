import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import {
  LEGACY_VIEW_PANEL_ID,
  projectLessonStepViews,
  resolveLessonViewPanels,
  resolveStepViewPanels
} from "../studio/src/renderer-registry.mjs";
import { getLesson } from "../studio/src/lessons/index.mjs";

test("legacy lessons retain one synthetic primary view panel", () => {
  const lesson = getLesson("arrays/find-largest");
  const trace = lesson.buildTrace({ values: [1, 3, 2] });
  const [panel] = resolveLessonViewPanels(lesson);

  assert.equal(panel.id, LEGACY_VIEW_PANEL_ID);
  assert.equal(panel.renderer, "array");
  assert.equal(panel.heading, null);
  assert.equal(panel.legacy, true);
  assert.equal(resolveStepViewPanels(lesson, trace[0])[0].snapshot, trace[0].view);
  assert.equal(projectLessonStepViews(lesson, trace[0])[0].model[0].value, 1);
  assert.equal(assertTrace(trace, lesson), trace);
});

test("composite lessons require safe unique panels with headings and registered renderers", () => {
  const lesson = createCompositeLesson();
  assert.equal(assertLesson(lesson), lesson);

  assert.throws(
    () => assertLesson({ ...lesson, renderer: "array" }),
    /exactly one renderer or a views panel list/
  );
  assert.throws(
    () => assertLesson(withViews(lesson, [])),
    /at least one panel/
  );
  assert.throws(
    () => assertLesson(withViews(lesson, [
      { id: "bad id", renderer: "array", heading: "Values" }
    ])),
    /safe id/
  );
  assert.throws(
    () => assertLesson(withViews(lesson, [
      { id: "same", renderer: "array", heading: "Values" },
      { id: "same", renderer: "sequence", heading: "Characters" }
    ])),
    /must be unique/
  );
  assert.throws(
    () => assertLesson(withViews(lesson, [
      { id: "values", renderer: "missing", heading: "Values" }
    ])),
    /Unsupported renderer/
  );
  assert.throws(
    () => assertLesson(withViews(lesson, [
      { id: "values", renderer: "array", heading: "  " }
    ])),
    /requires a heading/
  );
});

test("composite trace steps require exactly one keyed snapshot per declared panel", () => {
  const lesson = createCompositeLesson();
  const trace = buildCompositeTrace();

  assert.equal(assertTrace(trace, lesson), trace);

  const missing = buildCompositeTrace();
  delete missing[0].views.characters;
  assert.throws(() => assertTrace(missing, lesson), /exactly these panel ids: values, characters/);

  const extra = buildCompositeTrace();
  extra[0].views.extra = {};
  assert.throws(() => assertTrace(extra, lesson), /exactly these panel ids: values, characters/);

  const legacyShape = buildCompositeTrace();
  legacyShape[0].view = legacyShape[0].views.values;
  assert.throws(() => assertTrace(legacyShape, lesson), /must define views and must not define view/);
});

test("each composite panel owns validation and rewind snapshots", () => {
  const lesson = createCompositeLesson();

  const invalidSequence = buildCompositeTrace();
  invalidSequence[0].views.characters.values[0] = 4;
  assert.throws(
    () => assertTrace(invalidSequence, lesson),
    /View panel characters:.*Unicode character/
  );

  const sharedArraySnapshot = buildCompositeTrace();
  sharedArraySnapshot[1].views.values.values = sharedArraySnapshot[0].views.values.values;
  assert.throws(
    () => assertTrace(sharedArraySnapshot, lesson),
    /View panel values:.*values snapshot/
  );

  const sharedSequenceObject = buildCompositeTrace();
  sharedSequenceObject[1].views.characters.markers[0] = sharedSequenceObject[0].views.characters.markers[0];
  assert.throws(
    () => assertTrace(sharedSequenceObject, lesson),
    /View panel characters:.*markers objects/
  );
});

test("composite projection preserves panel order, identity, headings, and accessible models", () => {
  const lesson = createCompositeLesson();
  const trace = buildValidatedTrace(lesson, lesson.input.defaultValue);
  const projected = projectLessonStepViews(lesson, trace[0]);

  assert.deepEqual(projected.map(({ id }) => id), ["values", "characters"]);
  assert.deepEqual(projected.map(({ renderer }) => renderer), ["array", "sequence"]);
  assert.deepEqual(projected.map(({ heading }) => heading), ["Input values", "Target characters"]);
  assert.equal(projected[0].legacy, false);
  assert.match(projected[0].model[0].ariaLabel, /Index 0, value 1/);
  assert.match(projected[1].model[0].ariaLabel, /Character 0, value a/);
});

function createCompositeLesson() {
  const base = getLesson("arrays/find-largest");
  const lesson = {
    ...base,
    id: "test/composite",
    input: {
      ...base.input,
      defaultValue: { values: [1, 2], text: "ab" },
      sampleValue: { values: [3, 4], text: "cd" }
    },
    solve: ({ values, text }) => ({ total: values.length + Array.from(text).length }),
    buildTrace: buildCompositeTrace
  };
  delete lesson.renderer;
  lesson.views = [
    { id: "values", renderer: "array", heading: "Input values" },
    { id: "characters", renderer: "sequence", heading: "Target characters" }
  ];
  return lesson;
}

function withViews(lesson, views) {
  return { ...lesson, views };
}

function buildCompositeTrace(input = { values: [1, 2], text: "ab" }) {
  const characters = Array.from(input.text);
  return [
    createCompositeStep(0, "initialize", input.values, characters),
    {
      ...createCompositeStep(1, "complete", input.values, characters),
      result: { total: input.values.length + characters.length }
    }
  ];
}

function createCompositeStep(step, phase, values, characters) {
  return {
    step,
    phase,
    codeSteps: [phase === "complete" ? "return" : "initialize"],
    narration: phase === "complete" ? "Both panels are complete." : "Inspect both panels.",
    prompt: "How do the panels relate?",
    views: {
      values: {
        values: [...values],
        activeIndices: [0],
        ranges: [],
        markers: [{ index: 0, kind: "active", label: "current" }],
        annotations: [],
        changedIndices: []
      },
      characters: {
        values: [...characters],
        activeIndices: [0],
        ranges: [],
        markers: [{ index: 0, kind: "active", label: "current" }],
        annotations: [],
        changedIndices: []
      }
    }
  };
}
