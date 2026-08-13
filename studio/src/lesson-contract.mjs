import {
  inferRendererAdapter,
  resolveLessonViewPanels,
  resolveStepViewPanels
} from "./renderer-registry.mjs";
import { isSafeRendererToken } from "./renderer-validation.mjs";
import { isPipEmotion } from "./pip.mjs";

/**
 * The small contract every interactive lesson should satisfy.
 * Lesson-specific state belongs inside each trace step; player controls do not.
 */
export function assertLesson(lesson) {
  const required = [
    "id",
    "order",
    "topic",
    "catalogLabel",
    "catalogDescription",
    "title",
    "summary",
    "prerequisites",
    "patterns",
    "input",
    "solve",
    "buildTrace",
    "code",
    "stats",
    "complexity",
    "guide",
    "legend",
    "reflection"
  ];
  for (const key of required) {
    if (!lesson?.[key]) throw new Error(`Lesson is missing required field: ${key}`);
  }
  if (typeof lesson.buildTrace !== "function") throw new Error("Lesson buildTrace must be a function.");
  if (typeof lesson.solve !== "function") throw new Error("Lesson solve must be a function.");
  if (!Number.isInteger(lesson.order) || lesson.order < 1) {
    throw new Error("Lesson order must be a positive integer.");
  }
  resolveLessonViewPanels(lesson);
  if (!Array.isArray(lesson.prerequisites)) {
    throw new Error("Lesson prerequisites must be an array.");
  }
  if (
    !Array.isArray(lesson.patterns)
    || lesson.patterns.length === 0
    || lesson.patterns.some((pattern) => !isSafeRendererToken(pattern))
  ) {
    throw new Error("Lesson patterns require at least one safe pattern id.");
  }
  if (!Array.isArray(lesson.input.fields) || lesson.input.fields.length === 0) {
    throw new Error("Lesson input must define at least one field.");
  }
  if (typeof lesson.input.parse !== "function" || typeof lesson.input.serialize !== "function") {
    throw new Error("Lesson input must define parse and serialize functions.");
  }
  if (!lesson.input.defaultValue || !lesson.input.sampleValue) {
    throw new Error("Lesson input must define default and sample values.");
  }
  for (const field of lesson.input.fields) {
    if (!field.id || !field.label || !field.type) {
      throw new Error("Lesson input fields require id, label, and type.");
    }
  }
  if (!Array.isArray(lesson.code.lines) || lesson.code.lines.length === 0) {
    throw new Error("Lesson code must define source lines.");
  }
  if (!lesson.code.title || !lesson.code.filename || !isRepoRelativeModulePath(lesson.code.sourcePath)) {
    throw new Error("Lesson code requires a title, filename, and safe repo-relative sourcePath.");
  }
  if (lesson.code.sourcePath.split("/").at(-1) !== lesson.code.filename) {
    throw new Error("Lesson code filename must match the final sourcePath segment.");
  }
  for (const line of lesson.code.lines) {
    if (
      !Number.isInteger(line.number)
      || line.number < 1
      || typeof line.text !== "string"
      || !Array.isArray(line.steps)
      || line.steps.length === 0
    ) {
      throw new Error("Every source line requires a number, text, and code-step mapping.");
    }
  }
  if (!Array.isArray(lesson.stats) || lesson.stats.length === 0) {
    throw new Error("Lesson stats must define at least one item.");
  }
  for (const stat of lesson.stats) {
    if (!stat.label || typeof stat.value !== "function") {
      throw new Error("Lesson stats require a label and value selector.");
    }
  }
  for (const key of ["chip", "time", "space", "explanation"]) {
    if (!lesson.complexity[key]) throw new Error(`Lesson complexity is missing: ${key}`);
  }
  if (lesson.complexity.spaceLabel !== undefined && typeof lesson.complexity.spaceLabel !== "string") {
    throw new Error("Lesson complexity space label must be text.");
  }
  if (!lesson.guide.heading) throw new Error("Lesson guide requires a heading.");
  if (
    !Array.isArray(lesson.legend)
    || lesson.legend.length === 0
    || lesson.legend.some((item) => !isSafeRendererToken(item.kind) || !item.label)
  ) {
    throw new Error("Lesson legend requires at least one labeled item.");
  }
  for (const key of ["eyebrow", "title", "body"]) {
    if (!lesson.reflection[key]) throw new Error(`Lesson reflection is missing: ${key}`);
  }
  const fieldIds = lesson.input.fields.map((field) => field.id);
  if (new Set(fieldIds).size !== fieldIds.length) {
    throw new Error("Lesson input field ids must be unique.");
  }
  return lesson;
}

function isRepoRelativeModulePath(value) {
  return typeof value === "string"
    && /^(?:[a-z0-9][a-z0-9-]*\/)+[a-z0-9][a-z0-9-]*\.mjs$/.test(value);
}

export function assertTrace(trace, lesson) {
  if (!Array.isArray(trace) || trace.length === 0) {
    throw new Error("A lesson trace must contain at least one step.");
  }
  const inferredAdapter = lesson ? null : inferRendererAdapter(trace[0]?.view);
  const lessonPanels = lesson ? resolveLessonViewPanels(lesson) : null;

  const codeSteps = lesson
    ? new Set(lesson.code.lines.flatMap((line) => line.steps ?? []))
    : null;

  const resolvedPanelsByStep = trace.map((step, index) => {
    assertFiniteNumbers(step, `Trace step ${index}`);
    assertSharedStep(step, index, codeSteps);
    const stepPanels = lesson
      ? resolveStepViewPanels(lesson, step)
      : [{
          id: "primary",
          renderer: inferredAdapter.id,
          heading: null,
          adapter: inferredAdapter,
          legacy: true,
          snapshot: step.view
        }];
    for (const panel of stepPanels) {
      try {
        panel.adapter.assertView(panel.snapshot, index);
      } catch (error) {
        if (panel.legacy) throw error;
        throw panelError(panel.id, error);
      }
    }
    return stepPanels;
  });

  const panels = lessonPanels ?? resolvedPanelsByStep[0];
  for (const panel of panels) {
    const panelTrace = trace.map((step, index) => ({
      ...step,
      view: resolvedPanelsByStep[index].find(({ id }) => id === panel.id).snapshot
    }));
    try {
      panel.adapter.assertSnapshotOwnership(panelTrace);
    } catch (error) {
      if (panel.legacy) throw error;
      throw panelError(panel.id, error);
    }
  }
  if (trace.at(-1).phase !== "complete") {
    throw new Error("A trace must end with a complete step.");
  }
  return trace;
}

export function buildValidatedTrace(lesson, input) {
  const firstInput = structuredClone(input);
  const secondInput = structuredClone(input);
  const first = assertTrace(lesson.buildTrace(firstInput), lesson);
  const second = assertTrace(lesson.buildTrace(secondInput), lesson);
  if (!isDeeplyEqual(first, second)) {
    throw new Error(`Lesson trace is not deterministic: ${lesson.id}`);
  }
  if (!isDeeplyEqual(firstInput, input) || !isDeeplyEqual(secondInput, input)) {
    throw new Error(`Lesson mutated its input while building a trace: ${lesson.id}`);
  }
  const solverInput = structuredClone(input);
  const expectedResult = lesson.solve(solverInput);
  assertFiniteNumbers(expectedResult, "Lesson algorithm result");
  if (!isDeeplyEqual(solverInput, input)) {
    throw new Error(`Lesson mutated its input while solving: ${lesson.id}`);
  }
  if (!isDeeplyEqual(first.at(-1).result, expectedResult)) {
    throw new Error(`Lesson trace result does not match its algorithm: ${lesson.id}`);
  }
  return first;
}

function assertSharedStep(step, index, codeSteps) {
  if (step.step !== index) throw new Error(`Trace step ${index} is out of order.`);
  if (
    !step.phase
    || !Array.isArray(step.codeSteps)
    || step.codeSteps.length === 0
    || typeof step.narration !== "string"
    || typeof step.prompt !== "string"
  ) {
    throw new Error(`Trace step ${index} is missing phase, codeSteps, narration, or prompt.`);
  }
  if (step.pipCue !== undefined && !isPipEmotion(step.pipCue)) {
    throw new Error(`Trace step ${index} has an unknown Pip emotion cue: ${step.pipCue}.`);
  }
  for (const codeStep of step.codeSteps) {
    if (codeSteps && !codeSteps.has(codeStep)) {
      throw new Error(`Trace step ${index} references unknown code step: ${codeStep}.`);
    }
  }
}

function assertFiniteNumbers(value, label) {
  const pending = [{ value, path: label }];
  const visited = new WeakSet();

  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current.value === "number" && !Number.isFinite(current.value)) {
      throw new Error(`${current.path} contains a non-finite number.`);
    }
    if ((typeof current.value !== "object" && typeof current.value !== "function") || current.value === null) {
      continue;
    }
    if (visited.has(current.value)) continue;
    visited.add(current.value);

    for (const key of Reflect.ownKeys(current.value)) {
      pending.push({
        value: current.value[key],
        path: `${current.path}.${String(key)}`
      });
    }
  }
}

function isDeeplyEqual(left, right, leftToRight = new WeakMap(), rightToLeft = new WeakMap()) {
  if (Object.is(left, right)) return true;
  if (
    (typeof left !== "object" && typeof left !== "function")
    || left === null
    || (typeof right !== "object" && typeof right !== "function")
    || right === null
    || Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)
  ) {
    return false;
  }

  if (leftToRight.has(left) || rightToLeft.has(right)) {
    return leftToRight.get(left) === right && rightToLeft.get(right) === left;
  }
  leftToRight.set(left, right);
  rightToLeft.set(right, left);

  const leftKeys = Reflect.ownKeys(left);
  const rightKeys = Reflect.ownKeys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  for (const key of leftKeys) {
    if (
      !Object.hasOwn(right, key)
      || !isDeeplyEqual(left[key], right[key], leftToRight, rightToLeft)
    ) {
      return false;
    }
  }
  return true;
}

function panelError(panelId, error) {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`View panel ${panelId}: ${detail}`, { cause: error });
}
