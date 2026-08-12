import { arrayRendererAdapter } from "./array-renderer.mjs";
import { branchingRendererAdapter } from "./branching-renderer.mjs";
import { gridRendererAdapter } from "./grid-renderer.mjs";
import { graphRendererAdapter } from "./graph-renderer.mjs";
import { linkedListRendererAdapter } from "./linked-list-renderer.mjs";
import { lookupRendererAdapter } from "./lookup-renderer.mjs";
import { queueRendererAdapter } from "./queue-renderer.mjs";
import { sequenceRendererAdapter } from "./sequence-renderer.mjs";
import { stackRendererAdapter } from "./stack-renderer.mjs";
import { isSafeRendererToken } from "./renderer-validation.mjs";

const requiredHooks = ["assertView", "assertSnapshotOwnership", "projectView"];
export const LEGACY_VIEW_PANEL_ID = "primary";

export function createRendererRegistry(initialAdapters = []) {
  const adapterById = new Map();
  const registry = Object.freeze({
    register(adapter) {
      assertRendererAdapter(adapter);
      if (adapterById.has(adapter.id)) {
        throw new Error(`Renderer is already registered: ${adapter.id}`);
      }
      adapterById.set(adapter.id, adapter);
      return adapter;
    },
    get(id) {
      return adapterById.get(id) ?? null;
    },
    has(id) {
      return adapterById.has(id);
    },
    list() {
      return [...adapterById.values()];
    }
  });

  for (const adapter of initialAdapters) registry.register(adapter);
  return registry;
}

export const rendererRegistry = createRendererRegistry([
  arrayRendererAdapter,
  branchingRendererAdapter,
  gridRendererAdapter,
  graphRendererAdapter,
  linkedListRendererAdapter,
  lookupRendererAdapter,
  queueRendererAdapter,
  sequenceRendererAdapter,
  stackRendererAdapter
]);

export function registerRendererAdapter(adapter, registry = rendererRegistry) {
  return registry.register(adapter);
}

export function getRendererAdapter(id, registry = rendererRegistry) {
  const adapter = registry.get(id);
  if (!adapter) throw new Error(`Unsupported renderer: ${id}`);
  return adapter;
}

export function listRendererAdapters(registry = rendererRegistry) {
  return registry.list();
}

export function inferRendererAdapter(view, registry = rendererRegistry) {
  const matches = registry.list().filter((adapter) => adapter.matchesView?.(view));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`Trace view matches multiple renderers: ${matches.map(({ id }) => id).join(", ")}.`);
  }
  throw new Error("Unable to infer a renderer from the trace view.");
}

export function resolveLessonViewPanels(lesson, registry = rendererRegistry) {
  const hasLegacyRenderer = Object.hasOwn(lesson ?? {}, "renderer");
  const hasCompositeViews = Object.hasOwn(lesson ?? {}, "views");
  if (hasLegacyRenderer === hasCompositeViews) {
    throw new Error("A lesson must define exactly one renderer or a views panel list.");
  }

  if (hasLegacyRenderer) {
    const adapter = getRendererAdapter(lesson.renderer, registry);
    return [{
      id: LEGACY_VIEW_PANEL_ID,
      renderer: adapter.id,
      heading: null,
      adapter,
      legacy: true
    }];
  }

  if (!Array.isArray(lesson.views) || lesson.views.length === 0) {
    throw new Error("Composite lesson views must define at least one panel.");
  }

  const panelIds = new Set();
  return lesson.views.map((panel, index) => {
    if (!panel || !isSafeRendererToken(panel.id)) {
      throw new Error(`Lesson view panel ${index} requires a safe id.`);
    }
    if (panelIds.has(panel.id)) {
      throw new Error(`Lesson view panel ids must be unique: ${panel.id}.`);
    }
    panelIds.add(panel.id);
    if (typeof panel.heading !== "string" || panel.heading.trim() === "") {
      throw new Error(`Lesson view panel ${panel.id} requires a heading.`);
    }
    const adapter = getRendererAdapter(panel.renderer, registry);
    return {
      id: panel.id,
      renderer: adapter.id,
      heading: panel.heading,
      adapter,
      legacy: false
    };
  });
}

export function resolveStepViewPanels(lesson, step, registry = rendererRegistry) {
  const panels = resolveLessonViewPanels(lesson, registry);
  if (panels[0].legacy) {
    if (!Object.hasOwn(step ?? {}, "view") || Object.hasOwn(step ?? {}, "views")) {
      throw new Error("A single-renderer trace step must define view and must not define views.");
    }
    return panels.map((panel) => ({ ...panel, snapshot: step.view }));
  }

  if (Object.hasOwn(step ?? {}, "view")) {
    throw new Error("A composite trace step must define views and must not define view.");
  }
  assertExactViewKeys(step?.views, panels.map(({ id }) => id), step?.step);
  return panels.map((panel) => ({
    ...panel,
    snapshot: step.views[panel.id]
  }));
}

export function projectLessonStepViews(lesson, step, registry = rendererRegistry) {
  return resolveStepViewPanels(lesson, step, registry).map(({
    adapter,
    snapshot,
    ...panel
  }) => ({
    ...panel,
    model: adapter.projectView(snapshot)
  }));
}

function assertRendererAdapter(adapter) {
  if (!adapter || !isSafeRendererToken(adapter.id)) {
    throw new Error("A renderer adapter requires a safe id.");
  }
  for (const hook of requiredHooks) {
    if (typeof adapter[hook] !== "function") {
      throw new Error(`Renderer adapter ${adapter.id} requires a ${hook} hook.`);
    }
  }
  if (adapter.matchesView !== undefined && typeof adapter.matchesView !== "function") {
    throw new Error(`Renderer adapter ${adapter.id} matchesView must be a function.`);
  }
  return adapter;
}

function assertExactViewKeys(views, expectedIds, stepIndex) {
  if (!views || typeof views !== "object" || Array.isArray(views)) {
    throw new Error(`Trace step ${formatStepIndex(stepIndex)} must define a views object.`);
  }

  const actualKeys = Reflect.ownKeys(views);
  const hasOnlyStringKeys = actualKeys.every((key) => typeof key === "string");
  const actualIds = new Set(actualKeys);
  const exact = hasOnlyStringKeys
    && actualKeys.length === expectedIds.length
    && expectedIds.every((id) => actualIds.has(id));
  if (!exact) {
    throw new Error(
      `Trace step ${formatStepIndex(stepIndex)} views must contain exactly these panel ids: ${expectedIds.join(", ")}.`
    );
  }
}

function formatStepIndex(stepIndex) {
  return Number.isInteger(stepIndex) ? stepIndex : "unknown";
}
