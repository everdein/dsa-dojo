import {
  buildBinaryTree,
  validateLevelOrderTree
} from "../../trees/model.mjs";
import { levelOrderTraversal } from "../../trees/level-order-traversal.mjs";
import { formatNumber } from "./input.mjs";

export { levelOrderTraversal };

export function buildLevelOrderTraversalTrace({ slots }) {
  validateLevelOrderTree(slots);
  const root = buildBinaryTree(slots);
  const tree = describeTree(root);
  const trace = [];
  const queue = [];
  const visitedIds = new Set();
  const levels = [];
  let visitedCount = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    tree,
    queue,
    visitedIds,
    levels,
    currentLevel: root === null ? null : 0,
    nodesRemainingInLevel: 0,
    currentNode: null,
    currentLevelValues: [],
    narration: root === null
      ? "The model contains an empty tree, so there is no root to enqueue."
      : "Start with an empty FIFO queue. Breadth-first traversal begins by adding the root.",
    prompt: root === null
      ? "What grouped result should an empty tree return?"
      : `Prediction: which level contains root ${formatNumber(root.value)}?`
  }));

  if (root !== null) {
    queue.push({ node: root, level: 0 });
    trace.push(createStep({
      trace,
      phase: "enqueue-root",
      codeSteps: ["enqueue-root"],
      tree,
      queue,
      visitedIds,
      levels,
      currentLevel: 0,
      nodesRemainingInLevel: 1,
      currentNode: root,
      currentLevelValues: [],
      activeQueueIds: [root.id],
      changedQueueIds: [root.id],
      activeTreeIds: [root.id],
      changedTreeIds: [root.id],
      queueAnnotations: [{ itemId: root.id, label: "root enters first" }],
      treeAnnotations: [{ nodeId: root.id, label: "enqueued for level 0" }],
      narration: `Enqueue root ${formatNumber(root.value)}. It is the only node waiting at level 0.`,
      prompt: "Which endpoint must the traversal remove this node from?"
    }));

    let currentLevel = 0;
    while (queue.length > 0) {
      const levelSize = queue.filter((entry) => entry.level === currentLevel).length;
      const currentLevelValues = [];

      trace.push(createStep({
        trace,
        phase: "start-level",
        codeSteps: ["measure-level"],
        tree,
        queue,
        visitedIds,
        levels,
        currentLevel,
        nodesRemainingInLevel: levelSize,
        currentNode: null,
        currentLevelValues,
        activeQueueIds: queue.length ? [queue[0].node.id] : [],
        queueAnnotations: queue.length ? [{ itemId: queue[0].node.id, label: "level starts here" }] : [],
        narration: `Level ${currentLevel} begins with ${levelSize} ${levelSize === 1 ? "node" : "nodes"} already in the queue. Capture that boundary before adding any children.`,
        prompt: "Why must new children not increase this level's captured size?"
      }));

      for (let offset = 0; offset < levelSize; offset += 1) {
        const entry = queue[0];
        const node = entry.node;
        const remainingBeforeVisit = levelSize - offset;

        trace.push(createStep({
          trace,
          phase: "dequeue",
          codeSteps: ["dequeue-node"],
          tree,
          queue,
          visitedIds,
          levels,
          currentLevel,
          nodesRemainingInLevel: remainingBeforeVisit,
          currentNode: node,
          currentLevelValues,
          activeQueueIds: [node.id],
          activeTreeIds: [node.id],
          queueAnnotations: [{ itemId: node.id, label: "next out" }],
          narration: `Dequeue ${formatNumber(node.value)} from the front for level ${currentLevel}.`,
          prompt: "After visiting it, which children should enter at the back?"
        }));

        queue.shift();
        currentLevelValues.push(node.value);
        visitedIds.add(node.id);
        visitedCount += 1;
        trace.push(createStep({
          trace,
          phase: "visit",
          codeSteps: ["visit-node"],
          tree,
          queue,
          visitedIds,
          levels,
          currentLevel,
          nodesRemainingInLevel: remainingBeforeVisit - 1,
          currentNode: node,
          currentLevelValues,
          activeTreeIds: [node.id],
          changedTreeIds: [node.id],
          treeAnnotations: [{ nodeId: node.id, label: `visit ${visitedCount}` }],
          narration: `Append ${formatNumber(node.value)} to level ${currentLevel}.`,
          prompt: node.left !== null || node.right !== null
            ? "In which left-to-right order should its children enter the queue?"
            : "This leaf adds no work to the next level."
        }));

        for (const [side, child] of [["left", node.left], ["right", node.right]]) {
          if (child === null) continue;
          queue.push({ node: child, level: currentLevel + 1 });
          trace.push(createStep({
            trace,
            phase: "enqueue-child",
            codeSteps: [side === "left" ? "enqueue-left" : "enqueue-right"],
            tree,
            queue,
            visitedIds,
            levels,
            currentLevel,
            nodesRemainingInLevel: remainingBeforeVisit - 1,
            currentNode: node,
            currentLevelValues,
            activeQueueIds: [child.id],
            changedQueueIds: [child.id],
            activeTreeIds: [node.id, child.id],
            changedTreeIds: [child.id],
            queueAnnotations: [{ itemId: child.id, label: `queued for level ${currentLevel + 1}` }],
            treeAnnotations: [{ nodeId: child.id, label: `${side} child enters next level` }],
            narration: `Enqueue ${side} child ${formatNumber(child.value)} at the back for level ${currentLevel + 1}.`,
            prompt: side === "left" && node.right !== null
              ? "Which sibling enters next?"
              : "How does FIFO order preserve left-to-right traversal?"
          }));
        }
      }

      levels.push([...currentLevelValues]);
      trace.push(createStep({
        trace,
        phase: "finish-level",
        codeSteps: ["finish-level"],
        tree,
        queue,
        visitedIds,
        levels,
        currentLevel,
        nodesRemainingInLevel: 0,
        currentNode: null,
        currentLevelValues,
        activeQueueIds: queue.length ? [queue[0].node.id] : [],
        queueAnnotations: queue.length ? [{ itemId: queue[0].node.id, label: "next level starts here" }] : [],
        narration: `Finish level ${currentLevel} as [${currentLevelValues.map(formatNumber).join(", ")}].`,
        prompt: queue.length
          ? "How many queued nodes belong to the next level?"
          : "The queue is empty. What proves every node was visited?"
      }));
      currentLevel += 1;
    }
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-levels"],
      tree,
      queue,
      visitedIds,
      levels,
      currentLevel: null,
      nodesRemainingInLevel: 0,
      currentNode: null,
      currentLevelValues: [],
      narration: root === null
        ? "The empty tree has no levels, so return an empty array."
        : `The queue is empty after visiting ${visitedCount} ${visitedCount === 1 ? "node" : "nodes"}. Return ${levels.length} grouped ${levels.length === 1 ? "level" : "levels"}.`,
      prompt: "How did the captured level size separate one breadth-first layer from the next?"
    }),
    result: levels.map((level) => [...level])
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  tree,
  queue,
  visitedIds,
  levels,
  currentLevel,
  nodesRemainingInLevel,
  currentNode,
  currentLevelValues,
  narration,
  prompt,
  activeQueueIds = [],
  changedQueueIds = [],
  activeTreeIds = [],
  changedTreeIds = [],
  queueAnnotations = [],
  treeAnnotations = []
}) {
  const queueItems = queue.map(({ node, level }) => ({
    id: node.id,
    value: node.value,
    state: level === currentLevel ? "current-level" : "next-level"
  }));
  const queuedIds = new Set(queue.map(({ node }) => node.id));
  return {
    step: trace.length,
    phase,
    codeSteps: [...codeSteps],
    currentLevel,
    nodesRemainingInLevel,
    currentNodeId: currentNode?.id ?? null,
    currentNodeValue: currentNode?.value ?? null,
    queueSize: queueItems.length,
    visitedCount: visitedIds.size,
    completedLevels: levels.map((level) => [...level]),
    currentLevelValues: [...currentLevelValues],
    views: {
      tree: {
        nodes: tree.nodes.map((node) => ({ ...node })),
        edges: tree.edges.map((edge) => ({ ...edge })),
        rootIds: [...tree.rootIds],
        activeNodeIds: [...activeTreeIds],
        changedNodeIds: [...changedTreeIds],
        states: tree.nodes.flatMap((node) => {
          if (visitedIds.has(node.id)) {
            return [{ nodeId: node.id, kind: "visited", label: "visited" }];
          }
          if (queuedIds.has(node.id)) {
            return [{ nodeId: node.id, kind: "queued", label: "in queue" }];
          }
          return [];
        }),
        annotations: treeAnnotations.map((annotation) => ({ ...annotation })),
        pointers: [{
          nodeId: currentNode?.id ?? null,
          kind: "current",
          label: "current node"
        }]
      },
      queue: {
        structure: "queue",
        items: queueItems,
        frontItemId: queueItems[0]?.id ?? null,
        backItemId: queueItems.at(-1)?.id ?? null,
        activeItemIds: [...activeQueueIds],
        changedItemIds: [...changedQueueIds],
        annotations: queueAnnotations.map((annotation) => ({ ...annotation }))
      }
    },
    narration,
    prompt
  };
}

function describeTree(root) {
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
  nodes.sort((left, right) => Number(left.id.slice(5)) - Number(right.id.slice(5)));
  return { nodes, edges, rootIds: [root.id] };
}
