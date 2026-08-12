import {
  resultFromParents,
  unweightedShortestPath,
  validateShortestPathInput
} from "../../graphs/shortest-path.mjs";
import {
  buildAdjacency,
  graphNodeId,
  graphRendererSnapshot
} from "../../graphs/model.mjs";

export { unweightedShortestPath };

export function buildShortestPathTrace({ nodes, edges, start, target }) {
  validateShortestPathInput(nodes, edges, start, target);

  const adjacency = buildAdjacency(nodes, edges);
  const parents = new Map([[start, null]]);
  const discoveryEdges = new Map();
  const processed = new Set();
  const queue = [start];
  const trace = [];
  let head = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    nodes,
    edges,
    start,
    target,
    parents,
    discoveryEdges,
    processed,
    queue,
    head,
    current: start,
    activeEdgeIndex: null,
    changedNode: start,
    resultPath: [],
    resultEdgeIndices: [],
    reconstructionNode: null,
    narration: start === target
      ? `${start} is both the start and target, so its zero-edge path is already known.`
      : `Mark ${start} discovered and enqueue it as the first BFS frontier node.`,
    prompt: start === target
      ? "What distance does a node have from itself?"
      : "Which node leaves the queue first?"
  }));

  if (start === target) {
    return completeTrace({
      trace,
      nodes,
      edges,
      start,
      target,
      parents,
      discoveryEdges,
      processed,
      queue,
      head,
      result: { distance: 0, path: [start] },
      resultEdgeIndices: []
    });
  }

  let found = false;
  while (head < queue.length && !found) {
    const current = queue[head];
    head += 1;
    processed.add(current);
    trace.push(createStep({
      trace,
      phase: "dequeue",
      codeSteps: ["dequeue"],
      nodes,
      edges,
      start,
      target,
      parents,
      discoveryEdges,
      processed,
      queue,
      head,
      current,
      activeEdgeIndex: null,
      changedNode: null,
      resultPath: [],
      resultEdgeIndices: [],
      reconstructionNode: null,
      narration: `Dequeue ${current}. Every path reaching a later frontier node is at least as long as ${current}'s path.`,
      prompt: "Which neighbor is still undiscovered in declared edge order?"
    }));

    for (const neighbor of adjacency.get(current)) {
      if (parents.has(neighbor.node)) {
        trace.push(createStep({
          trace,
          phase: "skip-discovered",
          codeSteps: ["scan-neighbor", "skip-discovered"],
          nodes,
          edges,
          start,
          target,
          parents,
          discoveryEdges,
          processed,
          queue,
          head,
          current: neighbor.node,
          activeEdgeIndex: neighbor.edgeIndex,
          changedNode: null,
          resultPath: [],
          resultEdgeIndices: [],
          reconstructionNode: null,
          narration: `${neighbor.node} already has a parent, so another route cannot replace its first shortest discovery.`,
          prompt: "Which neighbor should BFS inspect next?"
        }));
        continue;
      }

      parents.set(neighbor.node, current);
      discoveryEdges.set(neighbor.node, neighbor.edgeIndex);
      const isTarget = neighbor.node === target;
      if (!isTarget) queue.push(neighbor.node);
      trace.push(createStep({
        trace,
        phase: isTarget ? "discover-target" : "discover-neighbor",
        codeSteps: isTarget
          ? ["scan-neighbor", "record-parent", "stop-on-discovery"]
          : ["scan-neighbor", "record-parent", "enqueue"],
        nodes,
        edges,
        start,
        target,
        parents,
        discoveryEdges,
        processed,
        queue,
        head,
        current: neighbor.node,
        activeEdgeIndex: neighbor.edgeIndex,
        changedNode: neighbor.node,
        resultPath: [],
        resultEdgeIndices: [],
        reconstructionNode: null,
        narration: isTarget
          ? `Discover target ${target} from ${current}. Its first BFS parent fixes a shortest path, so the search can stop.`
          : `Discover ${neighbor.node} from ${current}, record that parent, and enqueue the node once.`,
        prompt: isTarget
          ? "How can the parent map reconstruct the path back to the start?"
          : "Why is this first parent guaranteed to represent a shortest route?"
      }));
      if (isTarget) {
        found = true;
        break;
      }
    }
  }

  if (!parents.has(target)) {
    return completeTrace({
      trace,
      nodes,
      edges,
      start,
      target,
      parents,
      discoveryEdges,
      processed,
      queue,
      head,
      result: null,
      resultEdgeIndices: []
    });
  }

  const result = resultFromParents(parents, target);
  const reconstructedReverse = [];
  const resultEdgeIndices = [];
  let reconstructionNode = target;
  while (reconstructionNode !== null) {
    reconstructedReverse.push(reconstructionNode);
    const edgeIndex = discoveryEdges.get(reconstructionNode);
    if (edgeIndex !== undefined) resultEdgeIndices.push(edgeIndex);
    const resultPath = [...reconstructedReverse].reverse();
    trace.push(createStep({
      trace,
      phase: "reconstruct",
      codeSteps: ["reconstruct-path"],
      nodes,
      edges,
      start,
      target,
      parents,
      discoveryEdges,
      processed,
      queue,
      head,
      current: reconstructionNode,
      activeEdgeIndex: edgeIndex ?? null,
      changedNode: reconstructionNode,
      resultPath,
      resultEdgeIndices,
      reconstructionNode,
      narration: parents.get(reconstructionNode) === null
        ? `Reach start ${start}; reverse the collected parent chain to obtain ${formatPath(result.path)}.`
        : `Add ${reconstructionNode}, then follow its parent to ${parents.get(reconstructionNode)}.`,
      prompt: parents.get(reconstructionNode) === null
        ? "How many edges connect the nodes in this reconstructed path?"
        : "Which parent comes next?"
    }));
    reconstructionNode = parents.get(reconstructionNode);
  }

  return completeTrace({
    trace,
    nodes,
    edges,
    start,
    target,
    parents,
    discoveryEdges,
    processed,
    queue,
    head,
    result,
    resultEdgeIndices
  });
}

function completeTrace({
  trace,
  nodes,
  edges,
  start,
  target,
  parents,
  discoveryEdges,
  processed,
  queue,
  head,
  result,
  resultEdgeIndices
}) {
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      nodes,
      edges,
      start,
      target,
      parents,
      discoveryEdges,
      processed,
      queue,
      head,
      current: null,
      activeEdgeIndex: null,
      changedNode: null,
      resultPath: result?.path ?? [],
      resultEdgeIndices,
      reconstructionNode: null,
      narration: result === null
        ? `${target} was never discovered, so no path exists from ${start}.`
        : result.distance === 0
          ? `${start} reaches itself with distance 0.`
          : `${formatPath(result.path)} is a shortest path of ${result.distance} ${result.distance === 1 ? "edge" : "edges"}.`,
      prompt: "Why can no path with fewer edges have escaped this BFS?"
    }),
    result: result === null ? null : cloneResult(result)
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  nodes,
  edges,
  start,
  target,
  parents,
  discoveryEdges,
  processed,
  queue,
  head,
  current,
  activeEdgeIndex,
  changedNode,
  resultPath,
  resultEdgeIndices,
  reconstructionNode,
  narration,
  prompt
}) {
  const waiting = queue.slice(head);
  return {
    step: trace.length,
    phase,
    codeSteps,
    start,
    target,
    currentNode: current,
    discoveredCount: parents.size,
    processedCount: processed.size,
    queueSize: waiting.length,
    queueNodes: [...waiting],
    parents: [...parents].map(([node, parent]) => ({ node, parent })),
    resultPath: [...resultPath],
    resultEdgeIndices: [...resultEdgeIndices],
    reconstructionNode,
    views: {
      graph: buildGraphView({
        nodes,
        edges,
        start,
        target,
        parents,
        processed,
        current,
        activeEdgeIndex,
        changedNode,
        resultPath,
        resultEdgeIndices
      }),
      queue: buildQueueView(waiting, current, changedNode)
    },
    narration,
    prompt
  };
}

function buildGraphView({
  nodes,
  edges,
  start,
  target,
  parents,
  processed,
  current,
  activeEdgeIndex,
  changedNode,
  resultPath,
  resultEdgeIndices
}) {
  const pathNodes = new Set(resultPath);
  const pathEdges = new Set(resultEdgeIndices);
  const states = nodes.flatMap((node) => [
    ...(parents.has(node) ? [{
      node,
      kind: pathNodes.has(node) ? "shortest-path" : processed.has(node) ? "processed" : "discovered",
      label: pathNodes.has(node) ? "shortest path" : processed.has(node) ? "processed" : "discovered"
    }] : []),
    ...(node === start ? [{ node, kind: "start", label: "start" }] : []),
    ...(node === target ? [{ node, kind: "target", label: "target" }] : [])
  ]);
  const annotations = [...parents].map(([node, parent]) => ({
    node,
    label: parent === null ? "start: no parent" : `parent ${parent}`
  }));
  const activeEdges = [...new Set([
    ...pathEdges,
    ...(activeEdgeIndex === null ? [] : [activeEdgeIndex])
  ])];
  return graphRendererSnapshot(nodes, edges, {
    activeNodes: current === null ? [] : [current],
    activeEdges,
    changedNodes: changedNode === null ? [] : [changedNode],
    states,
    annotations
  });
}

function buildQueueView(waiting, current, changedNode) {
  const activeNode = current !== null && waiting.includes(current) ? current : null;
  const changed = changedNode !== null && waiting.includes(changedNode) ? changedNode : null;
  return {
    structure: "queue",
    items: waiting.map((node) => ({ id: graphNodeId(node), value: node, state: "frontier" })),
    frontItemId: waiting.length > 0 ? graphNodeId(waiting[0]) : null,
    backItemId: waiting.length > 0 ? graphNodeId(waiting.at(-1)) : null,
    activeItemIds: activeNode === null ? [] : [graphNodeId(activeNode)],
    changedItemIds: changed === null ? [] : [graphNodeId(changed)],
    annotations: changed === null
      ? []
      : [{ itemId: graphNodeId(changed), label: "newly discovered" }]
  };
}

function cloneResult(result) {
  return { distance: result.distance, path: [...result.path] };
}

function formatPath(path) {
  return path.join(" → ");
}
