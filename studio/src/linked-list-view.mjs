import { validateLinkedListValues } from "../../linked-lists/model.mjs";

const maximumLessonNodes = 8;

export function createLinkedListNodes(values, { cycleEntryIndex = null } = {}) {
  validateLinkedListValues(values);
  if (values.length > maximumLessonNodes) {
    throw new Error(`Keep the lesson to ${maximumLessonNodes} nodes or fewer.`);
  }
  if (
    cycleEntryIndex !== null
    && (
      !Number.isInteger(cycleEntryIndex)
      || cycleEntryIndex < 0
      || cycleEntryIndex >= values.length
    )
  ) {
    throw new Error("Cycle entry must identify an existing node.");
  }

  return values.map((value, index) => ({
    id: `node-${index}`,
    index,
    value,
    nextId: index < values.length - 1
      ? `node-${index + 1}`
      : cycleEntryIndex === null
        ? null
        : `node-${cycleEntryIndex}`
  }));
}

export function createLinkedListView(nodes, {
  pointers = [],
  activeNodeIds = [],
  changedNodeIds = [],
  states = [],
  annotations = []
} = {}) {
  return {
    nodes: nodes.map((node) => ({ ...node })),
    pointers: pointers.map((pointer) => ({ ...pointer })),
    activeNodeIds: [...activeNodeIds],
    changedNodeIds: [...changedNodeIds],
    states: states.map((state) => ({ ...state })),
    annotations: annotations.map((annotation) => ({ ...annotation }))
  };
}
