import {
  buildBinaryTree,
  validateLevelOrderTree
} from "../../trees/model.mjs";
import { isValidBinarySearchTree } from "../../trees/validate-bst.mjs";
import { formatNumber } from "./input.mjs";

export { isValidBinarySearchTree };

export function buildValidateBstTrace(slots) {
  validateLevelOrderTree(slots);
  const root = buildBinaryTree(slots);
  const topology = createTopology(root);
  const trace = [];
  const checkedNodeIds = new Set();
  const pending = root === null
    ? []
    : [{ node: root, lowerBound: null, upperBound: null }];
  let invalidNodeId = null;
  let currentEntry = null;
  let comparisons = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    topology,
    checkedNodeIds,
    invalidNodeId,
    currentEntry,
    pending,
    comparisons,
    narration: root === null
      ? "The tree is empty, so no value can violate strict binary-search-tree order."
      : "Start at the root with no lower or upper bound. Descendants will inherit exclusive bounds from every ancestor.",
    prompt: root === null
      ? "Why is an empty tree valid by definition?"
      : "Which bound will the root add for its left and right children?"
  }));

  while (pending.length > 0) {
    currentEntry = pending.pop();
    comparisons += 1;
    const { node, lowerBound, upperBound } = currentEntry;
    const bounds = formatBounds(lowerBound, upperBound);

    trace.push(createStep({
      trace,
      phase: "visit",
      codeSteps: ["pop-node", "check-bounds"],
      topology,
      checkedNodeIds,
      invalidNodeId,
      currentEntry,
      pending,
      comparisons,
      currentState: "checking",
      narration: `Visit ${formatNumber(node.value)} with required exclusive bounds ${bounds}.`,
      prompt: `Is ${formatNumber(node.value)} strictly inside ${bounds}?`
    }));

    if (!isInsideExclusiveBounds(node.value, lowerBound, upperBound)) {
      invalidNodeId = node.id;
      trace.push(createStep({
        trace,
        phase: "invalid",
        codeSteps: ["return-false"],
        topology,
        checkedNodeIds,
        invalidNodeId,
        currentEntry,
        pending,
        comparisons,
        currentState: "invalid",
        narration: `${formatNumber(node.value)} is not strictly inside ${bounds}. Stop at the first global ordering violation.`,
        prompt: "Which ancestor contributed the bound that this node violates?"
      }));
      break;
    }

    checkedNodeIds.add(node.id);
    if (node.right !== null) {
      pending.push({ node: node.right, lowerBound: node.value, upperBound });
    }
    if (node.left !== null) {
      pending.push({ node: node.left, lowerBound, upperBound: node.value });
    }
    trace.push(createStep({
      trace,
      phase: "valid",
      codeSteps: ["mark-valid", "push-children"],
      topology,
      checkedNodeIds,
      invalidNodeId,
      currentEntry,
      pending,
      comparisons,
      currentState: "valid",
      narration: `${formatNumber(node.value)} satisfies ${bounds}. Its children inherit tighter bounds before depth-first search continues.`,
      prompt: node.left === null && node.right === null
        ? "Which pending ancestor branch should the stack visit next?"
        : "How do these inherited bounds rule out values that a parent-only check would miss?"
    }));
  }

  const result = invalidNodeId === null;
  currentEntry = invalidNodeId === null ? null : currentEntry;
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: result ? ["return-true"] : ["return-false"],
      topology,
      checkedNodeIds,
      invalidNodeId,
      currentEntry,
      pending,
      comparisons,
      currentState: result ? null : "invalid",
      narration: result
        ? `All ${checkedNodeIds.size} ${checkedNodeIds.size === 1 ? "node" : "nodes"} satisfy their ancestor-derived exclusive bounds.`
        : "The first bounds violation proves the tree is not a strict binary search tree; no later visit can repair it.",
      prompt: result
        ? "Why does checking every node against ancestor-wide bounds prove the whole tree is valid?"
        : "Why is it safe to stop immediately after this violation?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  topology,
  checkedNodeIds,
  invalidNodeId,
  currentEntry,
  pending,
  comparisons,
  narration,
  prompt,
  currentState = null
}) {
  const currentNode = currentEntry?.node ?? null;
  const lowerBound = currentEntry?.lowerBound ?? null;
  const upperBound = currentEntry?.upperBound ?? null;
  const states = [...checkedNodeIds].map((nodeId) => ({
    nodeId,
    kind: "valid",
    label: "bounds satisfied"
  }));
  if (invalidNodeId !== null) {
    states.push({ nodeId: invalidNodeId, kind: "invalid", label: "bounds violated" });
  } else if (currentNode !== null && currentState === "checking") {
    states.push({ nodeId: currentNode.id, kind: "checking", label: "checking bounds" });
  }

  return {
    step: trace.length,
    phase,
    codeSteps,
    comparisons,
    checkedCount: checkedNodeIds.size,
    pendingCount: pending.length,
    currentNodeId: currentNode?.id ?? null,
    currentValue: currentNode?.value ?? null,
    lowerBound,
    upperBound,
    boundsLabel: formatBounds(lowerBound, upperBound),
    validSoFar: invalidNodeId === null,
    invalidNodeId,
    view: {
      nodes: topology.nodes.map((node) => ({ ...node })),
      edges: topology.edges.map((edge) => ({ ...edge })),
      rootIds: [...topology.rootIds],
      activeNodeIds: currentNode === null ? [] : [currentNode.id],
      changedNodeIds: currentState === "valid" || currentState === "invalid" ? [currentNode.id] : [],
      states: states.map((state) => ({ ...state })),
      annotations: currentNode === null ? [] : [{
        nodeId: currentNode.id,
        label: `exclusive ${formatBounds(lowerBound, upperBound)}`
      }],
      pointers: currentNode === null ? [] : [{
        nodeId: currentNode.id,
        kind: "current",
        label: "current"
      }]
    },
    narration,
    prompt
  };
}

function createTopology(root) {
  if (root === null) return { nodes: [], edges: [], rootIds: [] };
  const nodes = [];
  const edges = [];
  const pending = [root];
  while (pending.length > 0) {
    const node = pending.shift();
    nodes.push({ id: node.id, value: node.value });
    for (const [side, child] of [["left", node.left], ["right", node.right]]) {
      if (child === null) continue;
      edges.push({
        id: `edge-${node.slot}-${side}`,
        fromId: node.id,
        toId: child.id,
        label: side
      });
      pending.push(child);
    }
  }
  return { nodes, edges, rootIds: [root.id] };
}

function isInsideExclusiveBounds(value, lowerBound, upperBound) {
  return (lowerBound === null || value > lowerBound)
    && (upperBound === null || value < upperBound);
}

function formatBounds(lowerBound, upperBound) {
  const lower = lowerBound === null ? "-infinity" : formatNumber(lowerBound);
  const upper = upperBound === null ? "+infinity" : formatNumber(upperBound);
  return `(${lower}, ${upper})`;
}
