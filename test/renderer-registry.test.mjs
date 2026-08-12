import test from "node:test";
import assert from "node:assert/strict";
import { arrayRendererAdapter } from "../studio/src/array-renderer.mjs";
import {
  assertLesson,
  assertTrace,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { linkedListRendererAdapter } from "../studio/src/linked-list-renderer.mjs";
import {
  createRendererRegistry,
  getRendererAdapter,
  inferRendererAdapter,
  listRendererAdapters,
  registerRendererAdapter
} from "../studio/src/renderer-registry.mjs";
import { getLesson } from "../studio/src/lessons/index.mjs";

test("renderer registry exposes complete built-in adapters without central branching", () => {
  const registry = createRendererRegistry([
    arrayRendererAdapter,
    linkedListRendererAdapter
  ]);

  assert.deepEqual(listRendererAdapters(registry).map(({ id }) => id), ["array", "linked-list"]);
  assert.equal(getRendererAdapter("array", registry), arrayRendererAdapter);
  assert.equal(getRendererAdapter("linked-list", registry), linkedListRendererAdapter);
  assert.equal(inferRendererAdapter({ values: [1] }, registry), arrayRendererAdapter);
  assert.equal(inferRendererAdapter({ nodes: [] }, registry), linkedListRendererAdapter);
  assert.throws(() => getRendererAdapter("missing", registry), /Unsupported renderer/);
});

test("renderer registry rejects incomplete, unsafe, duplicate, and ambiguous adapters", () => {
  const registry = createRendererRegistry();
  const adapter = createCharacterAdapter("characters");

  assert.throws(() => registerRendererAdapter({ id: "unsafe id" }, registry), /safe id/);
  assert.throws(
    () => registerRendererAdapter({ id: "incomplete", assertView() {}, projectView() {} }, registry),
    /assertSnapshotOwnership/
  );
  registerRendererAdapter(adapter, registry);
  assert.throws(() => registerRendererAdapter(adapter, registry), /already registered/);

  const competingAdapter = createCharacterAdapter("other-characters");
  registerRendererAdapter(competingAdapter, registry);
  assert.throws(
    () => inferRendererAdapter({ characters: ["a"] }, registry),
    /matches multiple renderers/
  );
});

test("a registered renderer owns trace validation, snapshot ownership, and accessible projection", () => {
  const adapter = createCharacterAdapter("test-characters");
  registerRendererAdapter(adapter);

  const baseLesson = getLesson("arrays/find-largest");
  const lesson = {
    ...baseLesson,
    id: "strings/registry-proof",
    renderer: adapter.id,
    input: {
      ...baseLesson.input,
      defaultValue: { text: "aba" },
      sampleValue: { text: "dojo" },
      parse: ({ text }) => ({ text }),
      serialize: ({ text }) => ({ text })
    },
    solve: ({ text }) => text.length,
    buildTrace: ({ text }) => buildCharacterTrace(text)
  };

  assert.equal(assertLesson(lesson), lesson);
  const trace = buildValidatedTrace(lesson, lesson.input.defaultValue);
  assert.equal(assertTrace(trace, lesson), trace);
  const inferredTrace = buildCharacterTrace("xy");
  assert.equal(assertTrace(inferredTrace), inferredTrace);

  const projected = getRendererAdapter(adapter.id).projectView(trace[0].view);
  assert.deepEqual(projected.items.map(({ character }) => character), ["a", "b", "a"]);
  assert.match(projected.ariaLabel, /3-character sequence/);

  const invalidTrace = buildCharacterTrace("abc");
  invalidTrace[0].view.characters[0] = 42;
  assert.throws(() => assertTrace(invalidTrace, lesson), /character renderer view/);

  const sharedTrace = buildCharacterTrace("abc");
  sharedTrace[1].view.characters = sharedTrace[0].view.characters;
  assert.throws(() => assertTrace(sharedTrace, lesson), /characters snapshot/);
});

function createCharacterAdapter(id) {
  return Object.freeze({
    id,
    matchesView: (view) => Array.isArray(view?.characters),
    assertView(view, stepIndex) {
      if (!Array.isArray(view?.characters) || view.characters.some((value) => typeof value !== "string")) {
        throw new Error(`Trace step ${stepIndex} has an invalid character renderer view.`);
      }
      return view;
    },
    assertSnapshotOwnership(trace) {
      const snapshots = trace.map((step) => step.view.characters);
      if (new Set(snapshots).size !== snapshots.length) {
        throw new Error("Every trace step must own its character renderer characters snapshot.");
      }
      return trace;
    },
    projectView(view) {
      return {
        items: view.characters.map((character, index) => ({
          character,
          index,
          ariaLabel: `Index ${index}, character ${character}`
        })),
        ariaLabel: `${view.characters.length}-character sequence`
      };
    }
  });
}

function buildCharacterTrace(text) {
  const characters = [...text];
  return [
    {
      step: 0,
      phase: "initialize",
      codeSteps: ["initialize"],
      narration: "Read the character sequence.",
      prompt: "What should happen next?",
      view: { characters: [...characters] }
    },
    {
      step: 1,
      phase: "complete",
      codeSteps: ["return"],
      narration: "The sequence is complete.",
      prompt: "What did the sequence show?",
      result: characters.length,
      view: { characters: [...characters] }
    }
  ];
}
