import {
  inorderTraversal,
  validateInorderTraversalInput
} from "../../trees/inorder-traversal.mjs";
import {
  buildBinaryTree,
  listBinaryTreeNodes
} from "../../trees/model.mjs";
import { formatNumber } from "./input.mjs";

export { inorderTraversal };

export function buildInorderTraversalTrace(slots) {
  validateInorderTraversalInput(slots);

  const root = buildBinaryTree(slots);
  const nodes = listBinaryTreeNodes(root);
  const stack = [];
  const visitedNodes = [];
  const result = [];
  const trace = [];
  let current = root;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    root,
    nodes,
    stack,
    visitedNodes,
    result,
    current,
    actionNode: null,
    stackActionNode: null,
    narration: root === null
      ? "The tree is empty, so there is no path to descend and no value to visit."
      : `Start current at the root, ${formatNumber(root.value)}, with an empty stack.`,
    prompt: root === null
      ? "What should an inorder traversal of an empty tree return?"
      : "Why must the root wait while we follow its left child?"
  }));

  while (current !== null || stack.length > 0) {
    while (current !== null) {
      const pushed = current;
      stack.push(pushed);
      current = pushed.left;
      trace.push(createStep({
        trace,
        phase: "descend-left",
        codeSteps: ["push-node", "move-left"],
        root,
        nodes,
        stack,
        visitedNodes,
        result,
        current,
        actionNode: pushed,
        stackActionNode: pushed,
        stackAnnotation: "waiting for left subtree",
        narration: current === null
          ? `Push ${formatNumber(pushed.value)}, then follow its empty left link.`
          : `Push ${formatNumber(pushed.value)}, then descend left to ${formatNumber(current.value)}.`,
        prompt: current === null
          ? "Which node at the top is now ready to visit?"
          : "What must happen before this pushed node can be visited?"
      }));
    }

    const visited = stack.pop();
    current = visited;
    visitedNodes.push(visited);
    result.push(visited.value);
    trace.push(createStep({
      trace,
      phase: "visit",
      codeSteps: ["pop-node", "visit-node"],
      root,
      nodes,
      stack,
      visitedNodes,
      result,
      current,
      actionNode: visited,
      stackActionNode: null,
      narration: `Pop and visit ${formatNumber(visited.value)}. The output is now ${formatValues(result)}.`,
      prompt: "After visiting a node, which subtree comes next in inorder?"
    }));

    current = visited.right;
    trace.push(createStep({
      trace,
      phase: "move-right",
      codeSteps: ["move-right"],
      root,
      nodes,
      stack,
      visitedNodes,
      result,
      current,
      actionNode: visited,
      stackActionNode: stack.at(-1) ?? null,
      stackAnnotation: stack.length > 0 ? "pending ancestor" : null,
      narration: current === null
        ? `${formatNumber(visited.value)} has no right child. Resume from the nearest pending ancestor, if one exists.`
        : `Move right from ${formatNumber(visited.value)} to ${formatNumber(current.value)}; its left path must be pushed before it is visited.`,
      prompt: current === null
        ? "Will the outer loop continue because the stack still contains a node?"
        : "Why do we descend left again instead of visiting this right child immediately?"
    }));
  }

  const expected = inorderTraversal(slots);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      root,
      nodes,
      stack,
      visitedNodes,
      result: expected,
      current: null,
      actionNode: null,
      stackActionNode: null,
      narration: expected.length === 0
        ? "The empty tree produces an empty inorder traversal."
        : `Every node has been visited left, node, right: ${formatValues(expected)}.`,
      prompt: "How does the stack replace the return path of a recursive traversal?"
    }),
    result: [...expected]
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  root,
  nodes,
  stack,
  visitedNodes,
  result,
  current,
  actionNode,
  stackActionNode,
  narration,
  prompt,
  stackAnnotation = null
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentNodeId: current?.id ?? null,
    currentValue: current?.value ?? null,
    actionNodeId: actionNode?.id ?? null,
    stackDepth: stack.length,
    stackNodeIds: stack.map(({ id }) => id),
    visitedCount: visitedNodes.length,
    visitedNodeIds: visitedNodes.map(({ id }) => id),
    outputValues: [...result],
    views: {
      tree: buildTreeView({
        root,
        nodes,
        stack,
        visitedNodes,
        current,
        actionNode
      }),
      stack: buildStackView(stack, stackActionNode, stackAnnotation)
    },
    narration,
    prompt
  };
}

function buildTreeView({ root, nodes, stack, visitedNodes, current, actionNode }) {
  const stackIds = new Set(stack.map(({ id }) => id));
  const visitedIds = new Set(visitedNodes.map(({ id }) => id));
  const activeNodeIds = [...new Set([
    ...(current === null ? [] : [current.id]),
    ...(actionNode === null ? [] : [actionNode.id])
  ])];
  return {
    nodes: nodes.map(({ id, value }) => ({ id, value })),
    edges: nodes.flatMap((node) => [
      ...(node.left === null ? [] : [{
        id: `edge-${node.slot}-${node.left.slot}`,
        fromId: node.id,
        toId: node.left.id,
        label: "left"
      }]),
      ...(node.right === null ? [] : [{
        id: `edge-${node.slot}-${node.right.slot}`,
        fromId: node.id,
        toId: node.right.id,
        label: "right"
      }])
    ]),
    rootIds: root === null ? [] : [root.id],
    activeNodeIds,
    changedNodeIds: actionNode === null ? [] : [actionNode.id],
    states: nodes.flatMap((node) => [
      ...(visitedIds.has(node.id) ? [{
        nodeId: node.id,
        kind: "visited",
        label: "visited"
      }] : []),
      ...(stackIds.has(node.id) ? [{
        nodeId: node.id,
        kind: "pending",
        label: "waiting on stack"
      }] : [])
    ]),
    annotations: current === null ? [] : [{
      nodeId: current.id,
      label: "current node"
    }],
    pointers: [{
      nodeId: current?.id ?? null,
      kind: "current",
      label: "current"
    }]
  };
}

function buildStackView(stack, actionNode, annotation) {
  const items = stack.map(({ id, value }) => ({
    id,
    value,
    state: "pending"
  }));
  const active = actionNode !== null && stack.some(({ id }) => id === actionNode.id)
    ? [actionNode.id]
    : [];
  return {
    structure: "stack",
    items,
    topItemId: items.at(-1)?.id ?? null,
    activeItemIds: active,
    changedItemIds: active,
    annotations: annotation !== null && active.length > 0
      ? [{ itemId: active[0], label: annotation }]
      : []
  };
}

function formatValues(values) {
  return `[${values.map(formatNumber).join(", ")}]`;
}
