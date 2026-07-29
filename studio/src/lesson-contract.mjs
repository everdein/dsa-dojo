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
    "renderer",
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
  if (!Number.isInteger(lesson.order) || lesson.order < 1) throw new Error("Lesson order must be a positive integer.");
  if (lesson.renderer !== "array") throw new Error(`Unsupported renderer: ${lesson.renderer}`);
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
    if (!field.id || !field.label || !field.type) throw new Error("Lesson input fields require id, label, and type.");
  }
  if (!Array.isArray(lesson.code.lines) || lesson.code.lines.length === 0) {
    throw new Error("Lesson code must define source lines.");
  }
  if (!lesson.code.title || !lesson.code.filename) throw new Error("Lesson code requires a title and filename.");
  for (const line of lesson.code.lines) {
    if (!Number.isInteger(line.number) || typeof line.text !== "string" || !Array.isArray(line.steps) || line.steps.length === 0) {
      throw new Error("Every source line requires a number, text, and code-step mapping.");
    }
  }
  if (!Array.isArray(lesson.stats) || lesson.stats.length === 0) {
    throw new Error("Lesson stats must define at least one item.");
  }
  for (const stat of lesson.stats) {
    if (!stat.label || typeof stat.value !== "function") throw new Error("Lesson stats require a label and value selector.");
  }
  for (const key of ["chip", "time", "space", "explanation"]) {
    if (!lesson.complexity[key]) throw new Error(`Lesson complexity is missing: ${key}`);
  }
  if (!lesson.guide.heading) throw new Error("Lesson guide requires a heading.");
  if (!Array.isArray(lesson.legend) || lesson.legend.length === 0 || lesson.legend.some((item) => !item.kind || !item.label)) {
    throw new Error("Lesson legend requires at least one labeled item.");
  }
  for (const key of ["eyebrow", "title", "body"]) {
    if (!lesson.reflection[key]) throw new Error(`Lesson reflection is missing: ${key}`);
  }
  const fieldIds = lesson.input.fields.map((field) => field.id);
  if (new Set(fieldIds).size !== fieldIds.length) throw new Error("Lesson input field ids must be unique.");
  return lesson;
}

export function assertTrace(trace, lesson) {
  if (!Array.isArray(trace) || trace.length === 0) throw new Error("A lesson trace must contain at least one step.");
  const codeSteps = lesson
    ? new Set(lesson.code.lines.flatMap((line) => line.steps ?? []))
    : null;

  trace.forEach((step, index) => {
    if (step.step !== index) throw new Error(`Trace step ${index} is out of order.`);
    if (!step.phase || !Array.isArray(step.codeSteps) || step.codeSteps.length === 0 || typeof step.narration !== "string") {
      throw new Error(`Trace step ${index} is missing phase, codeSteps, or narration.`);
    }
    if (!step.view || !Array.isArray(step.view.values) || !Array.isArray(step.view.activeIndices) || !Array.isArray(step.view.ranges) || !Array.isArray(step.view.markers)) {
      throw new Error(`Trace step ${index} has an invalid renderer view.`);
    }
    for (const codeStep of step.codeSteps) {
      if (codeSteps && !codeSteps.has(codeStep)) {
        throw new Error(`Trace step ${index} references unknown code step: ${codeStep}.`);
      }
    }
    const maximumIndex = step.view.values.length - 1;
    for (const activeIndex of step.view.activeIndices) {
      if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex > maximumIndex) {
        throw new Error(`Trace step ${index} has an out-of-bounds active index.`);
      }
    }
    for (const marker of step.view.markers) {
      if (!Number.isInteger(marker.index) || marker.index < 0 || marker.index > maximumIndex) {
        throw new Error(`Trace step ${index} has an out-of-bounds marker.`);
      }
    }
    for (const range of step.view.ranges) {
      if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.start > range.end || range.end > maximumIndex) {
        throw new Error(`Trace step ${index} has an invalid range.`);
      }
    }
  });
  if (trace.at(-1).phase !== "complete") throw new Error("A trace must end with a complete step.");
  return trace;
}

export function buildValidatedTrace(lesson, input) {
  const firstInput = structuredClone(input);
  const secondInput = structuredClone(input);
  const first = assertTrace(lesson.buildTrace(firstInput), lesson);
  const second = assertTrace(lesson.buildTrace(secondInput), lesson);
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error(`Lesson trace is not deterministic: ${lesson.id}`);
  }
  if (JSON.stringify(firstInput) !== JSON.stringify(input) || JSON.stringify(secondInput) !== JSON.stringify(input)) {
    throw new Error(`Lesson mutated its input while building a trace: ${lesson.id}`);
  }
  const solverInput = structuredClone(input);
  const expectedResult = lesson.solve(solverInput);
  if (JSON.stringify(solverInput) !== JSON.stringify(input)) {
    throw new Error(`Lesson mutated its input while solving: ${lesson.id}`);
  }
  if (JSON.stringify(first.at(-1).result) !== JSON.stringify(expectedResult)) {
    throw new Error(`Lesson trace result does not match its algorithm: ${lesson.id}`);
  }
  return first;
}
