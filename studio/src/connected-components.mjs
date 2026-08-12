import { connectedComponents } from "../../graphs/connected-components.mjs";
import {
  buildAdjacency,
  graphNodeId,
  graphRendererSnapshot,
  validateGraphInput
} from "../../graphs/model.mjs";

export { connectedComponents };

export function buildConnectedComponentsTrace({ nodes, edges }) {
  validateGraphInput(nodes, edges);
  const adjacency = buildAdjacency(nodes, edges);
  const visited = new Set();
  const components = [];
  const trace = [];
  const queue = [];
  let head = 0;
  let current = null;

  trace.push(createStep({ trace, phase: "initialize", codeSteps: ["initialize"], nodes, edges, visited, components, queue, head, current,
    narration: "No node has been assigned to a component yet. Scan node labels in their declared order.",
    prompt: "Which node will start the first breadth-first search?" }));

  for (const start of nodes) {
    if (visited.has(start)) {
      trace.push(createStep({ trace, phase: "skip-start", codeSteps: ["scan-start"], nodes, edges, visited, components, queue: [], head: 0, current: start,
        narration: `${start} already belongs to a discovered component, so it cannot start another one.`,
        prompt: "Which unvisited node comes next?" }));
      continue;
    }
    const component = [];
    components.push(component);
    queue.length = 0;
    queue.push(start);
    head = 0;
    visited.add(start);
    trace.push(createStep({ trace, phase: "start-component", codeSteps: ["scan-start", "start-bfs"], nodes, edges, visited, components, queue, head, current: start,
      narration: `${start} is unvisited, so it starts component ${components.length}.`,
      prompt: "Which neighbors will join this component?" }));

    while (head < queue.length) {
      current = queue[head];
      head += 1;
      component.push(current);
      trace.push(createStep({ trace, phase: "visit", codeSteps: ["dequeue", "record"], nodes, edges, visited, components, queue, head, current,
        narration: `Dequeue ${current} and record it in component ${components.length}.`,
        prompt: "Which unvisited neighbors should enter the queue?" }));
      for (const neighbor of adjacency.get(current)) {
        if (visited.has(neighbor.node)) continue;
        visited.add(neighbor.node);
        queue.push(neighbor.node);
        trace.push(createStep({ trace, phase: "enqueue-neighbor", codeSteps: ["scan-neighbors", "enqueue"], nodes, edges, visited, components, queue, head, current: neighbor.node, activeEdgeIndex: neighbor.edgeIndex,
          narration: `${neighbor.node} is reached from ${current}; mark it now and enqueue it once.`,
          prompt: "Why mark a node before, rather than after, enqueueing it?" }));
      }
    }
  }

  trace.push({ ...createStep({ trace, phase: "complete", codeSteps: ["return"], nodes, edges, visited, components, queue: [], head: 0, current: null,
    narration: `Every node belongs to exactly one of ${components.length} connected components.`,
    prompt: "Why does each new BFS correspond to one component?" }), result: components.map((component) => [...component]) });
  return trace;
}

function createStep({ trace, phase, codeSteps, nodes, edges, visited, components, queue, head, current, narration, prompt, activeEdgeIndex = null }) {
  const waiting = queue.slice(head);
  const componentByNode = new Map(components.flatMap((component, index) => component.map((node) => [node, index + 1])));
  const currentComponent = components.length;
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentNode: current,
    componentCount: components.length,
    visitedCount: visited.size,
    queueSize: waiting.length,
    components: components.map((component) => [...component]),
    views: {
      graph: graphRendererSnapshot(nodes, edges, {
        activeNodes: current === null ? [] : [current],
        activeEdges: activeEdgeIndex === null ? [] : [activeEdgeIndex],
        states: [...visited].map((node) => ({ node, kind: "visited", label: componentByNode.has(node) ? `component ${componentByNode.get(node)}` : `component ${currentComponent}` })),
        annotations: [...componentByNode].map(([node, component]) => ({ node, label: `component ${component}` }))
      }),
      queue: {
        structure: "queue",
        items: waiting.map((node) => ({ id: graphNodeId(node), value: node, state: "frontier" })),
        frontItemId: waiting.length ? graphNodeId(waiting[0]) : null,
        backItemId: waiting.length ? graphNodeId(waiting.at(-1)) : null,
        activeItemIds: current !== null && waiting.includes(current) ? [graphNodeId(current)] : [],
        changedItemIds: [],
        annotations: waiting.map((node) => ({ itemId: graphNodeId(node), label: "discovered" }))
      }
    },
    narration,
    prompt
  };
}
