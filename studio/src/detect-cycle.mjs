import { createLinkedList } from "../../linked-lists/model.mjs";
import {
  createLinkedListNodes,
  createLinkedListView
} from "./linked-list-view.mjs";

export function buildDetectCycleTrace(values, cycleEntryIndex = null) {
  const head = createLinkedList(values, { cycleEntryIndex });
  const nodes = createLinkedListNodes(values, { cycleEntryIndex });
  const nodeReferences = collectNodeReferences(head, values.length);
  const indexByNode = new Map(nodeReferences.map((node, index) => [node, index]));
  const trace = [];
  let slow = head;
  let fast = head;
  let rounds = 0;

  trace.push(createStep({
    trace,
    nodes,
    indexByNode,
    cycleEntryIndex,
    phase: "initialize",
    codeSteps: ["function", "initialize-slow", "initialize-fast"],
    slow,
    fast,
    rounds,
    detected: null,
    narration: "Slow and fast both start at the head. Their initial match does not count because neither pointer has moved yet.",
    prompt: "Why must the pointers move before equality can prove a cycle?"
  }));

  while (fast !== null && fast.next !== null) {
    trace.push(createStep({
      trace,
      nodes,
      indexByNode,
      cycleEntryIndex,
      phase: "guard",
      codeSteps: ["guard"],
      slow,
      fast,
      rounds,
      detected: null,
      narration: `Fast is at node ${nodeIndex(fast, indexByNode)} and has another link available, so the next two-speed round is safe.`,
      prompt: "What would make a two-link fast move unsafe?"
    }));

    const previousSlow = slow;
    const previousFast = fast;
    const fastFirstHop = fast.next;
    slow = slow.next;
    fast = fastFirstHop.next;
    rounds += 1;

    trace.push(createStep({
      trace,
      nodes,
      indexByNode,
      cycleEntryIndex,
      phase: "advance",
      codeSteps: ["advance-slow", "advance-fast"],
      slow,
      fast,
      rounds,
      detected: null,
      narration: advanceNarration({
        previousSlow,
        slow,
        previousFast,
        fastFirstHop,
        fast,
        indexByNode
      }),
      prompt: "Which pointer gains one position on the other during this round?"
    }));

    if (slow === fast) {
      trace.push({
        ...createStep({
          trace,
          nodes,
          indexByNode,
          cycleEntryIndex,
          phase: "complete",
          codeSteps: ["compare", "return-true"],
          slow,
          fast,
          rounds,
          detected: true,
          narration: `Both pointers reached node ${nodeIndex(slow, indexByNode)} after ${rounds} ${rounds === 1 ? "round" : "rounds"}. A cycle is present.`,
          prompt: "Does this first meeting node have to be the cycle entry?"
        }),
        result: true
      });
      return trace;
    }

    trace.push(createStep({
      trace,
      nodes,
      indexByNode,
      cycleEntryIndex,
      phase: "compare",
      codeSteps: ["compare"],
      slow,
      fast,
      rounds,
      detected: null,
      narration: `Slow is at ${pointerName(slow, indexByNode)} and fast is at ${pointerName(fast, indexByNode)}, so the search continues.`,
      prompt: "What two outcomes can still end the search?"
    }));

    if (rounds > values.length) {
      throw new Error("Cycle detection exceeded the expected number of pointer rounds.");
    }
  }

  trace.push({
    ...createStep({
      trace,
      nodes,
      indexByNode,
      cycleEntryIndex,
      phase: "complete",
      codeSteps: ["guard", "return-false"],
      slow,
      fast,
      rounds,
      detected: false,
      narration: fast === null
        ? "Fast reached null, so the chain has an end and cannot contain a cycle."
        : `Fast reached node ${nodeIndex(fast, indexByNode)}, whose next link is null. The list has no cycle.`,
      prompt: "Why does reaching null rule out every possible cycle?"
    }),
    result: false
  });

  return trace;
}

function createStep({
  trace,
  nodes,
  indexByNode,
  cycleEntryIndex,
  phase,
  codeSteps,
  slow,
  fast,
  rounds,
  detected,
  narration,
  prompt
}) {
  const slowIndex = nodeIndex(slow, indexByNode);
  const fastIndex = nodeIndex(fast, indexByNode);
  const pointerIds = [slowIndex, fastIndex]
    .filter((index) => index !== null)
    .map(nodeId);
  const states = [];

  if (cycleEntryIndex !== null) {
    states.push({
      nodeId: nodeId(cycleEntryIndex),
      kind: "cycle-entry",
      label: "cycle entry"
    });
  }
  if (detected === true && slowIndex !== null) {
    states.push({
      nodeId: nodeId(slowIndex),
      kind: "meeting",
      label: "meeting node"
    });
  }

  return {
    step: trace.length,
    phase,
    codeSteps,
    slowIndex,
    fastIndex,
    rounds,
    detected,
    view: createLinkedListView(nodes, {
      pointers: [
        { nodeId: slowIndex === null ? null : nodeId(slowIndex), kind: "slow", label: "slow" },
        { nodeId: fastIndex === null ? null : nodeId(fastIndex), kind: "fast", label: "fast" }
      ],
      activeNodeIds: [...new Set(pointerIds)],
      changedNodeIds: [],
      states,
      annotations: []
    }),
    narration,
    prompt
  };
}

function collectNodeReferences(head, length) {
  const nodes = [];
  let current = head;

  for (let index = 0; index < length; index += 1) {
    if (current === null) {
      throw new Error("Linked-list topology ended before every input node was reached.");
    }
    nodes.push(current);
    current = current.next;
  }

  return nodes;
}

function nodeIndex(node, indexByNode) {
  if (node === null) return null;
  const index = indexByNode.get(node);
  if (index === undefined) {
    throw new Error("A pointer reached a node outside the lesson topology.");
  }
  return index;
}

function nodeId(index) {
  return `node-${index}`;
}

function pointerName(node, indexByNode) {
  const index = nodeIndex(node, indexByNode);
  return index === null ? "null" : `node ${index}`;
}

function advanceNarration({
  previousSlow,
  slow,
  previousFast,
  fastFirstHop,
  fast,
  indexByNode
}) {
  return `Slow moves ${pointerName(previousSlow, indexByNode)} → ${pointerName(slow, indexByNode)}. Fast moves ${pointerName(previousFast, indexByNode)} → ${pointerName(fastFirstHop, indexByNode)} → ${pointerName(fast, indexByNode)}.`;
}
