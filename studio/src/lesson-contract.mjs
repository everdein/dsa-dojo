const SUPPORTED_RENDERERS = new Set(["array", "linked-list"]);

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
  if (!Number.isInteger(lesson.order) || lesson.order < 1) {
    throw new Error("Lesson order must be a positive integer.");
  }
  if (!SUPPORTED_RENDERERS.has(lesson.renderer)) {
    throw new Error(`Unsupported renderer: ${lesson.renderer}`);
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
  if (!lesson.code.title || !lesson.code.filename) {
    throw new Error("Lesson code requires a title and filename.");
  }
  for (const line of lesson.code.lines) {
    if (
      !Number.isInteger(line.number)
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
    || lesson.legend.some((item) => !isSafeKind(item.kind) || !item.label)
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

export function assertTrace(trace, lesson) {
  if (!Array.isArray(trace) || trace.length === 0) {
    throw new Error("A lesson trace must contain at least one step.");
  }
  const renderer = lesson?.renderer ?? (trace[0]?.view?.nodes ? "linked-list" : "array");
  if (!SUPPORTED_RENDERERS.has(renderer)) throw new Error(`Unsupported renderer: ${renderer}`);

  const codeSteps = lesson
    ? new Set(lesson.code.lines.flatMap((line) => line.steps ?? []))
    : null;

  trace.forEach((step, index) => {
    assertSharedStep(step, index, codeSteps);
    if (renderer === "array") assertArrayView(step.view, index);
    if (renderer === "linked-list") assertLinkedListView(step.view, index);
  });

  assertSnapshotOwnership(trace, renderer);
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
  for (const codeStep of step.codeSteps) {
    if (codeSteps && !codeSteps.has(codeStep)) {
      throw new Error(`Trace step ${index} references unknown code step: ${codeStep}.`);
    }
  }
}

function assertArrayView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.values)
    || !Array.isArray(view.activeIndices)
    || !Array.isArray(view.ranges)
    || !Array.isArray(view.markers)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid array renderer view.`);
  }
  if (view.values.length === 0 || Array.from(view.values).some((value) => !Number.isFinite(value))) {
    throw new Error(`Trace step ${stepIndex} must contain finite renderer values.`);
  }
  if (view.annotations !== undefined && !Array.isArray(view.annotations)) {
    throw new Error(`Trace step ${stepIndex} has invalid annotations.`);
  }
  if (view.changedIndices !== undefined && !Array.isArray(view.changedIndices)) {
    throw new Error(`Trace step ${stepIndex} has invalid changed indices.`);
  }

  const maximumIndex = view.values.length - 1;
  for (const activeIndex of view.activeIndices) {
    assertArrayIndex(activeIndex, maximumIndex, stepIndex, "active index");
  }
  for (const marker of view.markers) {
    if (!isSafeKind(marker.kind) || !marker.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid marker.`);
    }
    assertArrayIndex(marker.index, maximumIndex, stepIndex, "marker");
  }
  for (const range of view.ranges) {
    if (
      !isSafeKind(range.kind)
      || !range.label
      || !Number.isInteger(range.start)
      || !Number.isInteger(range.end)
      || range.start < 0
      || range.start > range.end
      || range.end > maximumIndex
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid range.`);
    }
  }
  for (const annotation of view.annotations ?? []) {
    if (!annotation.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid annotation.`);
    }
    assertArrayIndex(annotation.index, maximumIndex, stepIndex, "annotation");
  }
  for (const changedIndex of view.changedIndices ?? []) {
    assertArrayIndex(changedIndex, maximumIndex, stepIndex, "changed index");
  }
}

function assertLinkedListView(view, stepIndex) {
  if (
    !view
    || !Array.isArray(view.nodes)
    || !Array.isArray(view.pointers)
    || !Array.isArray(view.activeNodeIds)
    || !Array.isArray(view.changedNodeIds)
    || !Array.isArray(view.states)
    || !Array.isArray(view.annotations)
  ) {
    throw new Error(`Trace step ${stepIndex} has an invalid linked-list renderer view.`);
  }
  const nodeIds = new Set();
  view.nodes.forEach((node, nodeIndex) => {
    if (
      !isSafeId(node.id)
      || nodeIds.has(node.id)
      || node.index !== nodeIndex
      || !Number.isFinite(node.value)
      || (node.nextId !== null && !isSafeId(node.nextId))
    ) {
      throw new Error(`Trace step ${stepIndex} has an invalid linked-list node.`);
    }
    nodeIds.add(node.id);
  });
  for (const node of view.nodes) {
    if (node.nextId !== null && !nodeIds.has(node.nextId)) {
      throw new Error(`Trace step ${stepIndex} has a dangling next-node reference.`);
    }
  }
  for (const nodeId of view.activeNodeIds) {
    assertNodeId(nodeId, nodeIds, stepIndex, "active node");
  }
  for (const nodeId of view.changedNodeIds) {
    assertNodeId(nodeId, nodeIds, stepIndex, "changed node");
  }
  for (const pointer of view.pointers) {
    if (!isSafeKind(pointer.kind) || !pointer.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid pointer.`);
    }
    if (pointer.nodeId !== null) {
      assertNodeId(pointer.nodeId, nodeIds, stepIndex, "pointer");
    }
  }
  for (const state of view.states) {
    if (!isSafeKind(state.kind) || !state.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid node state.`);
    }
    assertNodeId(state.nodeId, nodeIds, stepIndex, "node state");
  }
  for (const annotation of view.annotations) {
    if (!annotation.label) {
      throw new Error(`Trace step ${stepIndex} has an invalid annotation.`);
    }
    assertNodeId(annotation.nodeId, nodeIds, stepIndex, "annotation");
  }
}

function assertSnapshotOwnership(trace, renderer) {
  if (renderer === "array") {
    assertOwnedArrays(
      trace,
      ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"],
      "array renderer"
    );
    assertOwnedObjects(trace, ["ranges", "markers", "annotations"], "array renderer");
    return;
  }

  assertOwnedArrays(
    trace,
    ["nodes", "pointers", "activeNodeIds", "changedNodeIds", "states", "annotations"],
    "linked-list renderer"
  );
  assertOwnedObjects(
    trace,
    ["nodes", "pointers", "states", "annotations"],
    "linked-list renderer"
  );
}

function assertOwnedArrays(trace, properties, label) {
  for (const property of properties) {
    const snapshots = trace
      .map((step) => step.view[property])
      .filter((snapshot) => snapshot !== undefined);
    if (new Set(snapshots).size !== snapshots.length) {
      throw new Error(`Every trace step must own its ${label} ${property} snapshot.`);
    }
  }
}

function assertOwnedObjects(trace, properties, label) {
  for (const property of properties) {
    const objects = trace.flatMap((step) => step.view[property] ?? []);
    if (new Set(objects).size !== objects.length) {
      throw new Error(`Every trace step must own its ${label} ${property} objects.`);
    }
  }
}

function assertArrayIndex(index, maximumIndex, stepIndex, label) {
  if (!Number.isInteger(index) || index < 0 || index > maximumIndex) {
    throw new Error(`Trace step ${stepIndex} has an out-of-bounds ${label}.`);
  }
}

function assertNodeId(nodeId, nodeIds, stepIndex, label) {
  if (!nodeIds.has(nodeId)) {
    throw new Error(`Trace step ${stepIndex} has an unknown ${label} reference.`);
  }
}

function isSafeKind(kind) {
  return typeof kind === "string" && /^[a-z][a-z0-9-]*$/.test(kind);
}

function isSafeId(id) {
  return typeof id === "string" && /^[a-z][a-z0-9-]*$/.test(id);
}
