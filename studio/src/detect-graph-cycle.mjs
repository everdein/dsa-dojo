import { detectGraphCycle } from "../../graphs/detect-cycle.mjs";
import {
  buildAdjacency,
  graphNodeId,
  graphRendererSnapshot,
  validateGraphInput
} from "../../graphs/model.mjs";

export { detectGraphCycle };

export function buildDetectGraphCycleTrace({ nodes, edges }) {
  validateGraphInput(nodes, edges);
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set();
  const finished = new Set();
  const stack = [];
  const trace = [];
  let componentCount = 0;
  let cycleEdgeIndex = null;
  let cycleNodeLabels = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    nodes,
    edges,
    adjacency,
    visited,
    finished,
    stack,
    componentCount,
    cycleEdgeIndex,
    cycleNodeLabels,
    currentNode: null,
    parentNode: null,
    neighborNode: null,
    activeEdgeIndex: null,
    narration: "No node has been visited. Scan every declared node so disconnected components cannot hide a cycle.",
    prompt: "Which unvisited node will start the first depth-first search?"
  }));

  for (const start of nodes) {
    if (visited.has(start)) continue;
    componentCount += 1;
    trace.push(createStep({
      trace,
      phase: "start-component",
      codeSteps: ["scan-start", "start-component"],
      nodes,
      edges,
      adjacency,
      visited,
      finished,
      stack,
      componentCount,
      cycleEdgeIndex,
      cycleNodeLabels,
      currentNode: start,
      parentNode: null,
      neighborNode: null,
      activeEdgeIndex: null,
      graphAnnotations: [{ node: start, label: `component ${componentCount} start` }],
      narration: `${start} is unvisited, so it starts DFS component ${componentCount}.`,
      prompt: "What parent should a component root remember?"
    }));

    stack.push(createFrame(start, null, null));
    trace.push(createStep({
      trace,
      phase: "push",
      codeSteps: ["push-frame"],
      nodes,
      edges,
      adjacency,
      visited,
      finished,
      stack,
      componentCount,
      cycleEdgeIndex,
      cycleNodeLabels,
      currentNode: start,
      parentNode: null,
      neighborNode: null,
      activeEdgeIndex: null,
      changedNodes: [start],
      stackActionNode: start,
      stackAnnotation: "root frame pushed",
      narration: `Push a frame for ${start} with no parent and its next-neighbor position at 0.`,
      prompt: "Why must a DFS frame remember which neighbor comes next?"
    }));

    visited.add(start);
    trace.push(createStep({
      trace,
      phase: "visit",
      codeSteps: ["visit-node"],
      nodes,
      edges,
      adjacency,
      visited,
      finished,
      stack,
      componentCount,
      cycleEdgeIndex,
      cycleNodeLabels,
      currentNode: start,
      parentNode: null,
      neighborNode: null,
      activeEdgeIndex: null,
      changedNodes: [start],
      stackActionNode: start,
      stackAnnotation: "marked visited",
      narration: `Mark ${start} visited before inspecting its neighbors.`,
      prompt: "What does a later edge to an already visited non-parent node prove?"
    }));

    while (stack.length > 0 && cycleEdgeIndex === null) {
      const frame = stack.at(-1);
      const neighbors = adjacency.get(frame.node);
      if (frame.nextNeighborIndex >= neighbors.length) {
        const completed = stack.pop();
        finished.add(completed.node);
        const resumed = stack.at(-1)?.node ?? null;
        trace.push(createStep({
          trace,
          phase: "pop",
          codeSteps: ["pop-frame"],
          nodes,
          edges,
          adjacency,
          visited,
          finished,
          stack,
          componentCount,
          cycleEdgeIndex,
          cycleNodeLabels,
          currentNode: completed.node,
          parentNode: completed.parent,
          neighborNode: null,
          activeEdgeIndex: null,
          changedNodes: [completed.node],
          stackActionNode: resumed,
          stackAnnotation: resumed === null ? null : "resume parent frame",
          narration: `${completed.node} has no uninspected neighbors, so pop its completed frame.`,
          prompt: resumed === null
            ? "Is another unvisited component start still possible?"
            : `Which neighbor will ${resumed}'s resumed frame inspect next?`
        }));
        continue;
      }

      const neighbor = neighbors[frame.nextNeighborIndex];
      frame.nextNeighborIndex += 1;
      trace.push(createStep({
        trace,
        phase: "inspect-edge",
        codeSteps: ["inspect-edge"],
        nodes,
        edges,
        adjacency,
        visited,
        finished,
        stack,
        componentCount,
        cycleEdgeIndex,
        cycleNodeLabels,
        currentNode: frame.node,
        parentNode: frame.parent,
        neighborNode: neighbor.node,
        activeEdgeIndex: neighbor.edgeIndex,
        graphAnnotations: uniqueAnnotations([
          { node: frame.node, label: "current frame" },
          { node: neighbor.node, label: "neighbor under inspection" }
        ]),
        stackActionNode: frame.node,
        stackAnnotation: `next neighbor ${frame.nextNeighborIndex} of ${neighbors.length}`,
        narration: `Inspect edge ${edgeLabel(edges[neighbor.edgeIndex])} from ${frame.node} toward ${neighbor.node}.`,
        prompt: neighbor.node === frame.parent
          ? "Is this simply the undirected edge back to the parent?"
          : visited.has(neighbor.node)
            ? "This neighbor is visited. Is it the remembered parent?"
            : "How should DFS remember this unvisited neighbor?"
      }));

      if (neighbor.node === frame.parent) {
        trace.push(createStep({
          trace,
          phase: "skip-parent-edge",
          codeSteps: ["skip-parent"],
          nodes,
          edges,
          adjacency,
          visited,
          finished,
          stack,
          componentCount,
          cycleEdgeIndex,
          cycleNodeLabels,
          currentNode: frame.node,
          parentNode: frame.parent,
          neighborNode: neighbor.node,
          activeEdgeIndex: neighbor.edgeIndex,
          graphAnnotations: uniqueAnnotations([
            { node: frame.node, label: `parent is ${frame.parent}` },
            { node: neighbor.node, label: "parent edge ignored" }
          ]),
          stackActionNode: frame.node,
          stackAnnotation: "parent remembered",
          narration: `${neighbor.node} is ${frame.node}'s parent. This is the same undirected tree edge used to arrive, not a cycle.`,
          prompt: "What would be different about a visited neighbor that is not the parent?"
        }));
        continue;
      }

      if (visited.has(neighbor.node)) {
        cycleEdgeIndex = neighbor.edgeIndex;
        cycleNodeLabels = uniqueLabels([frame.node, neighbor.node]);
        trace.push(createStep({
          trace,
          phase: "detect-cycle",
          codeSteps: ["detect-cycle"],
          nodes,
          edges,
          adjacency,
          visited,
          finished,
          stack,
          componentCount,
          cycleEdgeIndex,
          cycleNodeLabels,
          currentNode: frame.node,
          parentNode: frame.parent,
          neighborNode: neighbor.node,
          activeEdgeIndex: neighbor.edgeIndex,
          changedNodes: cycleNodeLabels,
          graphAnnotations: cycleNodeLabels.map((node) => ({ node, label: "cycle witness" })),
          stackActionNode: frame.node,
          stackAnnotation: "non-parent revisit",
          narration: frame.node === neighbor.node
            ? `${frame.node} has a self-loop, so edge ${edgeLabel(edges[neighbor.edgeIndex])} is a cycle by itself.`
            : `${neighbor.node} is already visited and is not ${frame.node}'s parent. Edge ${edgeLabel(edges[neighbor.edgeIndex])} closes a cycle.`,
          prompt: "Why is one non-parent revisit enough to return true?"
        }));
        break;
      }

      trace.push(createStep({
        trace,
        phase: "discover-neighbor",
        codeSteps: ["discover-neighbor"],
        nodes,
        edges,
        adjacency,
        visited,
        finished,
        stack,
        componentCount,
        cycleEdgeIndex,
        cycleNodeLabels,
        currentNode: frame.node,
        parentNode: frame.parent,
        neighborNode: neighbor.node,
        activeEdgeIndex: neighbor.edgeIndex,
        changedNodes: [neighbor.node],
        graphAnnotations: [{ node: neighbor.node, label: `parent will be ${frame.node}` }],
        stackActionNode: frame.node,
        stackAnnotation: "child discovered",
        narration: `${neighbor.node} is unvisited. Remember ${frame.node} as its parent before descending.`,
        prompt: "What must the new frame store before its first neighbor is inspected?"
      }));

      const childFrame = createFrame(neighbor.node, frame.node, neighbor.edgeIndex);
      stack.push(childFrame);
      trace.push(createStep({
        trace,
        phase: "push",
        codeSteps: ["push-frame"],
        nodes,
        edges,
        adjacency,
        visited,
        finished,
        stack,
        componentCount,
        cycleEdgeIndex,
        cycleNodeLabels,
        currentNode: neighbor.node,
        parentNode: frame.node,
        neighborNode: null,
        activeEdgeIndex: neighbor.edgeIndex,
        changedNodes: [neighbor.node],
        stackActionNode: neighbor.node,
        stackAnnotation: `parent ${frame.node}`,
        narration: `Push ${neighbor.node}'s frame above ${frame.node}; its parent is ${frame.node}.`,
        prompt: "Why does the parent frame stay underneath instead of restarting later?"
      }));

      visited.add(neighbor.node);
      trace.push(createStep({
        trace,
        phase: "visit",
        codeSteps: ["visit-node"],
        nodes,
        edges,
        adjacency,
        visited,
        finished,
        stack,
        componentCount,
        cycleEdgeIndex,
        cycleNodeLabels,
        currentNode: neighbor.node,
        parentNode: frame.node,
        neighborNode: null,
        activeEdgeIndex: neighbor.edgeIndex,
        changedNodes: [neighbor.node],
        stackActionNode: neighbor.node,
        stackAnnotation: "marked visited",
        narration: `Mark ${neighbor.node} visited. Its frame will inspect neighbors in declared edge order.`,
        prompt: "Which edge will this new top frame inspect first?"
      }));
    }

    if (cycleEdgeIndex !== null) break;
  }

  const result = cycleEdgeIndex !== null;
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: [result ? "return-true" : "return-false"],
      nodes,
      edges,
      adjacency,
      visited,
      finished,
      stack,
      componentCount,
      cycleEdgeIndex,
      cycleNodeLabels,
      currentNode: cycleNodeLabels[0] ?? null,
      parentNode: null,
      neighborNode: cycleNodeLabels[1] ?? cycleNodeLabels[0] ?? null,
      activeEdgeIndex: cycleEdgeIndex,
      changedNodes: cycleNodeLabels,
      graphAnnotations: cycleNodeLabels.map((node) => ({
        node,
        label: result ? "cycle witness" : "finished"
      })),
      stackActionNode: stack.at(-1)?.node ?? null,
      stackAnnotation: result ? "search stops at witness" : null,
      narration: result
        ? `A visited non-parent edge proves this undirected graph contains a cycle.`
        : `Every component finished without a non-parent revisit, so the graph is acyclic.`,
      prompt: result
        ? "How would removing the highlighted witness edge break this detected cycle?"
        : "Why did ignoring only parent edges avoid false positives?"
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
  edges,
  adjacency,
  visited,
  finished,
  stack,
  componentCount,
  cycleEdgeIndex,
  cycleNodeLabels,
  currentNode,
  parentNode,
  neighborNode,
  activeEdgeIndex,
  narration,
  prompt,
  changedNodes = [],
  graphAnnotations = [],
  stackActionNode = null,
  stackAnnotation = null
}) {
  const activeNodes = uniqueLabels([currentNode, neighborNode].filter((node) => node !== null));
  const cycleNodes = new Set(cycleNodeLabels);
  const states = nodes.flatMap((node) => [
    ...(finished.has(node) ? [{ node, kind: "finished", label: "DFS finished" }] : []),
    ...(!finished.has(node) && visited.has(node) ? [{ node, kind: "visited", label: "visited" }] : []),
    ...(cycleNodes.has(node) ? [{ node, kind: "cycle", label: "cycle witness" }] : [])
  ]);
  return {
    step: trace.length,
    phase,
    codeSteps: [...codeSteps],
    componentCount,
    currentNode,
    parentNode,
    neighborNode,
    activeEdgeIndex,
    cycleEdgeIndex,
    cycleNodeLabels: [...cycleNodeLabels],
    hasCycle: cycleEdgeIndex !== null,
    visitedCount: visited.size,
    finishedCount: finished.size,
    stackDepth: stack.length,
    stackFrames: stack.map((frame) => ({ ...frame })),
    views: {
      graph: graphRendererSnapshot(nodes, edges, {
        activeNodes,
        activeEdges: activeEdgeIndex === null ? [] : [activeEdgeIndex],
        changedNodes: uniqueLabels(changedNodes),
        states,
        annotations: uniqueAnnotations(graphAnnotations)
      }),
      stack: buildStackView(stack, adjacency, stackActionNode, stackAnnotation)
    },
    narration,
    prompt
  };
}

function buildStackView(stack, adjacency, actionNode, annotation) {
  const items = stack.map((frame, index) => ({
    id: graphNodeId(frame.node),
    value: `${frame.node} | parent ${frame.parent ?? "none"} | next ${frame.nextNeighborIndex}/${adjacency.get(frame.node).length}`,
    state: index === stack.length - 1 ? "current-frame" : "dfs-frame"
  }));
  const actionId = actionNode === null ? null : graphNodeId(actionNode);
  const activeItemIds = actionId !== null && items.some(({ id }) => id === actionId)
    ? [actionId]
    : [];
  return {
    structure: "stack",
    items,
    topItemId: items.at(-1)?.id ?? null,
    activeItemIds,
    changedItemIds: [...activeItemIds],
    annotations: annotation !== null && activeItemIds.length
      ? [{ itemId: activeItemIds[0], label: annotation }]
      : []
  };
}

function createFrame(node, parent, parentEdgeIndex) {
  return { node, parent, parentEdgeIndex, nextNeighborIndex: 0 };
}

function uniqueLabels(labels) {
  return [...new Set(labels)];
}

function uniqueAnnotations(annotations) {
  const seen = new Set();
  return annotations.filter(({ node }) => {
    if (seen.has(node)) return false;
    seen.add(node);
    return true;
  });
}

function edgeLabel(edge) {
  return `${edge.from}:${edge.to}`;
}
