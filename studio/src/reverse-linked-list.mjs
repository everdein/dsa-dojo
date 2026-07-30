import { formatNumber } from "./input.mjs";
import {
  createLinkedListNodes,
  createLinkedListView
} from "./linked-list-view.mjs";

export function buildReverseLinkedListTrace(values) {
  const nodes = createLinkedListNodes(values);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const reversedNodeIds = [];
  const trace = [];
  let currentId = nodes[0]?.id ?? null;
  let previousId = null;
  let nextId = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    nodes,
    currentId,
    previousId,
    nextId,
    reversedNodeIds,
    narration: currentId === null
      ? "The list is empty, so both previous and current start at null."
      : "Previous starts at null and current starts at the head. The studio gives the algorithm a disposable list to rewire.",
    prompt: "Why is previous null before the first link changes?"
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
      previousId,
      nextId: null,
      reversedNodeIds,
      narration: hasCurrent
        ? `Current points to node ${currentNode.index}, so one more link must be reversed.`
        : "Current is null. Every node now belongs to the reversed chain.",
      prompt: hasCurrent
        ? "Which reference must be protected before current.next changes?"
        : "Which pointer now identifies the new head?"
    }));

    if (!hasCurrent) break;

    nextId = currentNode.nextId;
    trace.push(createStep({
      trace,
      phase: "save-next",
      codeSteps: ["save-next"],
      nodes,
      currentId,
      previousId,
      nextId,
      reversedNodeIds,
      annotations: [{
        nodeId: currentId,
        label: nextId === null ? "saved null" : `saved node ${nodeById.get(nextId).index}`
      }],
      narration: nextId === null
        ? `Save null before changing node ${currentNode.index}'s final link.`
        : `Save node ${nodeById.get(nextId).index} so the unreversed suffix cannot be lost.`,
      prompt: "What would become unreachable if we changed current.next without saving next?"
    }));

    const oldNextId = currentNode.nextId;
    const oldNextLabel = oldNextId === null ? "null" : `node ${nodeById.get(oldNextId).index}`;
    currentNode.nextId = previousId;
    reversedNodeIds.push(currentId);
    trace.push(createStep({
      trace,
      phase: "reverse-link",
      codeSteps: ["reverse-link"],
      nodes,
      currentId,
      previousId,
      nextId,
      reversedNodeIds,
      changedNodeIds: [currentId],
      annotations: [{
        nodeId: currentId,
        label: previousId === null
          ? "next → null"
          : `next → node ${nodeById.get(previousId).index}`
      }],
      narration: previousId === null
        ? `Redirect node ${currentNode.index}'s next link from ${oldNextLabel} to null.`
        : `Redirect node ${currentNode.index}'s next link from ${oldNextLabel} to node ${nodeById.get(previousId).index}.`,
      prompt: "Which chain does current now lead?"
    }));

    previousId = currentId;
    currentId = nextId;
    nextId = null;
    trace.push(createStep({
      trace,
      phase: "advance",
      codeSteps: ["advance-pointers"],
      nodes,
      currentId,
      previousId,
      nextId,
      reversedNodeIds,
      narration: currentId === null
        ? `Previous now points to node ${nodeById.get(previousId).index}, and current advances to null.`
        : `Previous takes the reversed head while current advances to node ${nodeById.get(currentId).index}.`,
      prompt: currentId === null
        ? "What will the while condition decide now?"
        : "Which side of current is already reversed?"
    }));
  }

  const result = valuesFromNodes(nodes, previousId);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      nodes,
      currentId,
      previousId,
      nextId,
      reversedNodeIds,
      complete: true,
      annotations: previousId === null
        ? []
        : [{ nodeId: previousId, label: "new head" }],
      narration: previousId === null
        ? "The reverse of an empty list is still an empty list."
        : `Previous is the new head. The list is reversed after changing ${reversedNodeIds.length} ${reversedNodeIds.length === 1 ? "link" : "links"}.`,
      prompt: "Can you explain how saving next kept every node reachable?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  nodes,
  currentId,
  previousId,
  nextId,
  reversedNodeIds,
  narration,
  prompt,
  changedNodeIds = [],
  annotations = [],
  complete = false
}) {
  const pointers = [
    { nodeId: previousId, kind: "previous", label: "previous" },
    { nodeId: currentId, kind: "current", label: "current" }
  ];
  if (phase === "save-next" || phase === "reverse-link") {
    pointers.push({ nodeId: nextId, kind: "next", label: "saved next" });
  }

  const currentNode = nodes.find((node) => node.id === currentId) ?? null;
  const previousNode = nodes.find((node) => node.id === previousId) ?? null;
  const nextNode = nodes.find((node) => node.id === nextId) ?? null;
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentNodeId: currentId,
    currentIndex: currentNode?.index ?? null,
    currentValue: currentNode?.value ?? null,
    previousNodeId: previousId,
    previousIndex: previousNode?.index ?? null,
    previousValue: previousNode?.value ?? null,
    nextNodeId: nextId,
    nextIndex: nextNode?.index ?? null,
    nextValue: nextNode?.value ?? null,
    linksReversed: reversedNodeIds.length,
    nodeCount: nodes.length,
    view: createLinkedListView(nodes, {
      pointers,
      activeNodeIds: complete || currentId === null ? [] : [currentId],
      changedNodeIds,
      states: reversedNodeIds.map((nodeId) => ({
        nodeId,
        kind: "reversed",
        label: "reversed"
      })),
      annotations
    }),
    narration,
    prompt
  };
}

function valuesFromNodes(nodes, headId) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const values = [];
  const seen = new Set();
  let currentId = headId;
  while (currentId !== null) {
    if (seen.has(currentId) || !nodeById.has(currentId)) {
      throw new Error("The reversed trace produced an invalid list.");
    }
    seen.add(currentId);
    const current = nodeById.get(currentId);
    values.push(current.value);
    currentId = current.nextId;
  }
  return values;
}
