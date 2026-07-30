import { formatNumber } from "./input.mjs";
import {
  createLinkedListNodes,
  createLinkedListView
} from "./linked-list-view.mjs";

export function buildTraverseLinkedListTrace(values) {
  const nodes = createLinkedListNodes(values);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const visitedNodeIds = [];
  const collectedValues = [];
  const trace = [];
  let currentId = nodes[0]?.id ?? null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    nodes,
    currentId,
    visitedNodeIds,
    collectedValues,
    narration: currentId === null
      ? "The head is null, so this list begins empty."
      : `Start at the head, node 0, whose value is ${formatNumber(nodes[0].value)}.`,
    prompt: "What tells us whether there is a node available to visit?"
  }));

  while (true) {
    const hasCurrent = currentId !== null;
    const currentNode = hasCurrent ? nodeById.get(currentId) : null;
    trace.push(createStep({
      trace,
      phase: "check",
      codeSteps: ["check-current"],
      nodes,
      currentId,
      visitedNodeIds,
      collectedValues,
      narration: hasCurrent
        ? `Current points to node ${currentNode.index}, so the traversal continues.`
        : "Current is null. There are no more nodes to visit.",
      prompt: hasCurrent
        ? "Which value will be recorded before we follow the next link?"
        : "Why is null the stopping rule instead of an array length?"
    }));

    if (!hasCurrent) break;

    collectedValues.push(currentNode.value);
    visitedNodeIds.push(currentId);
    trace.push(createStep({
      trace,
      phase: "visit",
      codeSteps: ["record-value"],
      nodes,
      currentId,
      visitedNodeIds,
      collectedValues,
      changedNodeIds: [currentId],
      annotations: [{ nodeId: currentId, label: "recorded" }],
      narration: `Record ${formatNumber(currentNode.value)}. The collected result now contains ${collectedValues.length} ${collectedValues.length === 1 ? "value" : "values"}.`,
      prompt: "What must stay unchanged until this node's value has been recorded?"
    }));

    const previousId = currentId;
    currentId = currentNode.nextId;
    trace.push(createStep({
      trace,
      phase: "advance",
      codeSteps: ["advance-current"],
      nodes,
      currentId,
      visitedNodeIds,
      collectedValues,
      annotations: [{
        nodeId: previousId,
        label: currentId === null
          ? "next → null"
          : `next → node ${nodeById.get(currentId).index}`
      }],
      narration: currentId === null
        ? `Follow node ${currentNode.index}'s next link to null.`
        : `Follow node ${currentNode.index}'s next link to node ${nodeById.get(currentId).index}.`,
      prompt: currentId === null
        ? "What will the while condition decide now?"
        : "How is following next different from adding one to an array index?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      nodes,
      currentId,
      visitedNodeIds,
      collectedValues,
      complete: true,
      narration: collectedValues.length === 0
        ? "The empty list produces an empty traversal result."
        : `Traversal is complete after visiting all ${collectedValues.length} ${collectedValues.length === 1 ? "node" : "nodes"}.`,
      prompt: "Can you explain why every reachable node was visited exactly once?"
    }),
    result: [...collectedValues]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  nodes,
  currentId,
  visitedNodeIds,
  collectedValues,
  narration,
  prompt,
  changedNodeIds = [],
  annotations = [],
  complete = false
}) {
  const currentNode = nodes.find((node) => node.id === currentId) ?? null;
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentNodeId: currentId,
    currentIndex: currentNode?.index ?? null,
    currentValue: currentNode?.value ?? null,
    visitedCount: visitedNodeIds.length,
    nodeCount: nodes.length,
    collectedValues: [...collectedValues],
    view: createLinkedListView(nodes, {
      pointers: [{ nodeId: currentId, kind: "current", label: "current" }],
      activeNodeIds: complete || currentId === null ? [] : [currentId],
      changedNodeIds,
      states: visitedNodeIds.map((nodeId) => ({
        nodeId,
        kind: "visited",
        label: "visited"
      })),
      annotations
    }),
    narration,
    prompt
  };
}
