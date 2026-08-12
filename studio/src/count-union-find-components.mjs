import {
  graphNodeId,
  graphRendererSnapshot,
  validateGraphInput
} from "../../graphs/model.mjs";
import { countComponentsWithUnionFind } from "../../disjoint-sets/count-components.mjs";
import { UnionFind } from "../../disjoint-sets/union-find.mjs";

export { countComponentsWithUnionFind };

export function buildCountUnionFindComponentsTrace({ nodes, edges }) {
  validateGraphInput(nodes, edges);
  const unionFind = new UnionFind(nodes);
  const trace = [];
  let successfulUnions = 0;
  let redundantEdges = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    nodes,
    edges,
    unionFind,
    edgeIndex: null,
    edge: null,
    edgesProcessed: 0,
    successfulUnions,
    redundantEdges,
    countBefore: nodes.length,
    countAfter: nodes.length,
    narration: `Start with ${nodes.length} singleton components, one for every declared graph node.`,
    prompt: "Which first edge will connect two different roots?"
  }));

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
    const edge = edges[edgeIndex];
    const leftFind = unionFind.inspectFind(edge.from);
    const rightFind = unionFind.inspectFind(edge.to);
    const countBefore = unionFind.components;

    trace.push(createStep({
      trace,
      phase: "inspect-edge",
      codeSteps: ["scan-edge", "find-roots"],
      nodes,
      edges,
      unionFind,
      edgeIndex,
      edge,
      edgesProcessed: edgeIndex,
      successfulUnions,
      redundantEdges,
      countBefore,
      countAfter: countBefore,
      leftRoot: leftFind.root,
      rightRoot: rightFind.root,
      edgeStateKind: "candidate",
      edgeStateLabel: "current edge endpoints",
      forestActiveNodes: uniqueInOrder([...leftFind.path, ...rightFind.path]),
      forestActiveEdgeChildren: uniqueInOrder([
        ...leftFind.path.slice(0, -1),
        ...rightFind.path.slice(0, -1)
      ]),
      parentActiveKeys: uniqueInOrder([edge.from, edge.to]),
      narration: `Inspect edge ${edge.from}:${edge.to}: its endpoints currently lead to roots ${leftFind.root} and ${rightFind.root}.`,
      prompt: leftFind.root === rightFind.root
        ? "Why will this edge be redundant?"
        : "How should merging these roots change the component count?"
    }));

    const details = unionFind.unionWithDetails(edge.from, edge.to);
    const countAfter = unionFind.components;
    if (details.merged) successfulUnions += 1;
    else redundantEdges += 1;

    const changedNodes = uniqueInOrder([
      ...details.compressed,
      ...(details.merged ? [details.root, details.attachedRoot] : [])
    ]);
    const forestStates = [
      ...details.compressed.map((node) => ({
        node,
        kind: "compressed",
        label: "path compressed"
      })),
      ...(details.merged ? [
        { node: details.root, kind: "union-root", label: "winning root" },
        { node: details.attachedRoot, kind: "attached", label: "attached root" }
      ] : [{ node: details.root, kind: "redundant", label: "same root" }])
    ];
    const forestAnnotations = details.merged
      ? [
          { node: details.root, label: `root · size ${details.size}` },
          { node: details.attachedRoot, label: `parent -> ${details.root}` }
        ]
      : [{ node: details.root, label: `already one component · size ${details.size}` }];

    trace.push(createStep({
      trace,
      phase: details.merged ? "union-success" : "redundant-edge",
      codeSteps: details.merged ? ["union-roots", "decrement-count"] : ["union-roots", "keep-count"],
      nodes,
      edges,
      unionFind,
      edgeIndex,
      edge,
      edgesProcessed: edgeIndex + 1,
      successfulUnions,
      redundantEdges,
      countBefore,
      countAfter,
      leftRoot: details.leftRoot,
      rightRoot: details.rightRoot,
      merged: details.merged,
      attachedRoot: details.attachedRoot,
      resultRoot: details.root,
      compressedNodes: details.compressed,
      edgeStateKind: details.merged ? "successful" : "redundant",
      edgeStateLabel: details.merged ? "successful union" : "redundant edge",
      edgeChangedNodes: uniqueInOrder([edge.from, edge.to]),
      forestActiveNodes: uniqueInOrder([details.root, details.attachedRoot, ...details.compressed]
        .filter((node) => node !== null)),
      forestActiveEdgeChildren: uniqueInOrder([
        ...details.compressed,
        ...(details.attachedRoot === null ? [] : [details.attachedRoot])
      ]),
      forestChangedNodes: changedNodes,
      forestStates,
      forestAnnotations,
      parentActiveKeys: uniqueInOrder([edge.from, edge.to]),
      parentResultKeys: [details.root],
      narration: details.merged
        ? `The roots differ, so attach ${details.attachedRoot} beneath ${details.root} and reduce the component count from ${countBefore} to ${countAfter}.`
        : `Both endpoints already have root ${details.root}. This edge is redundant, so the component count remains ${countAfter}.`,
      prompt: details.merged
        ? "Why does one successful root merge reduce the count by exactly one?"
        : "How can a redundant edge form a cycle without changing connectivity?"
    }));
  }

  const result = countComponentsWithUnionFind(nodes, edges);
  const roots = nodes.filter((node) => unionFind.parentOf(node) === node);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-count"],
      nodes,
      edges,
      unionFind,
      edgeIndex: null,
      edge: null,
      edgesProcessed: edges.length,
      successfulUnions,
      redundantEdges,
      countBefore: unionFind.components,
      countAfter: unionFind.components,
      edgeAllComponentRoots: true,
      parentResultKeys: roots,
      narration: `After ${edges.length} ${edges.length === 1 ? "edge" : "edges"}, ${successfulUnions} successful unions leave ${result} connected ${result === 1 ? "component" : "components"}.`,
      prompt: "Why is final components equal to initial nodes minus successful unions?"
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
  unionFind,
  edgeIndex,
  edge,
  edgesProcessed,
  successfulUnions,
  redundantEdges,
  countBefore,
  countAfter,
  narration,
  prompt,
  leftRoot = null,
  rightRoot = null,
  merged = null,
  attachedRoot = null,
  resultRoot = null,
  compressedNodes = [],
  edgeStateKind = null,
  edgeStateLabel = null,
  edgeChangedNodes = [],
  edgeAllComponentRoots = false,
  forestActiveNodes = [],
  forestActiveEdgeChildren = [],
  forestChangedNodes = [],
  forestStates = [],
  forestAnnotations = [],
  parentActiveKeys = [],
  parentResultKeys = []
}) {
  const snapshot = unionFind.snapshot();
  return {
    step: trace.length,
    phase,
    codeSteps,
    edgeIndex,
    edgeCount: edges.length,
    currentEdge: edge === null ? null : { ...edge },
    edgesProcessed,
    successfulUnions,
    redundantEdges,
    components: snapshot.components,
    countBefore,
    countAfter,
    countReduced: countAfter < countBefore,
    leftRoot,
    rightRoot,
    merged,
    attachedRoot,
    resultRoot,
    compressedNodes: [...compressedNodes],
    parent: { ...snapshot.parent },
    size: { ...snapshot.size },
    views: {
      "edge-stream": createEdgeStreamView({
        nodes,
        edges,
        unionFind,
        edgeIndex,
        edge,
        edgeStateKind,
        edgeStateLabel,
        edgeChangedNodes,
        edgeAllComponentRoots
      }),
      forest: createForestView({
        unionFind,
        activeNodes: forestActiveNodes,
        activeEdgeChildren: forestActiveEdgeChildren,
        changedNodes: forestChangedNodes,
        actionStates: forestStates,
        actionAnnotations: forestAnnotations
      }),
      parents: createParentLookupView({
        unionFind,
        activeKeys: parentActiveKeys,
        resultKeys: parentResultKeys,
        actionAnnotations: forestAnnotations
      })
    },
    narration,
    prompt
  };
}

function createEdgeStreamView({
  nodes,
  edges,
  unionFind,
  edgeIndex,
  edge,
  edgeStateKind,
  edgeStateLabel,
  edgeChangedNodes,
  edgeAllComponentRoots
}) {
  const activeNodes = edge === null ? [] : uniqueInOrder([edge.from, edge.to]);
  const states = edgeAllComponentRoots
    ? nodes.map((node) => ({ node, kind: "component", label: "assigned component" }))
    : edgeStateKind === null
      ? []
      : activeNodes.map((node) => ({ node, kind: edgeStateKind, label: edgeStateLabel }));
  const annotations = edgeAllComponentRoots
    ? nodes.map((node) => ({ node, label: `root ${unionFind.inspectFind(node).root}` }))
    : edgeStateKind === null
      ? []
      : activeNodes.map((node) => ({ node, label: edgeStateLabel }));
  return graphRendererSnapshot(nodes, edges, {
    activeNodes,
    activeEdges: edgeIndex === null ? [] : [edgeIndex],
    changedNodes: edgeChangedNodes,
    states,
    annotations
  });
}

function createForestView({
  unionFind,
  activeNodes,
  activeEdgeChildren,
  changedNodes,
  actionStates,
  actionAnnotations
}) {
  const edgeByChild = new Map();
  const edges = [];
  for (let index = 0; index < unionFind.nodes.length; index += 1) {
    const child = unionFind.nodes[index];
    const parent = unionFind.parentOf(child);
    if (child === parent) continue;
    const forestEdge = {
      id: `parent-edge-${index}`,
      fromId: graphNodeId(child),
      toId: graphNodeId(parent),
      label: "parent"
    };
    edges.push(forestEdge);
    edgeByChild.set(child, forestEdge.id);
  }
  const annotationByNode = rootAnnotations(unionFind);
  for (const { node, label } of actionAnnotations) annotationByNode.set(node, label);
  return {
    structure: "graph",
    directed: true,
    nodes: unionFind.nodes.map((node) => ({ id: graphNodeId(node), value: node })),
    edges,
    activeNodeIds: uniqueInOrder(activeNodes).map(graphNodeId),
    activeEdgeIds: uniqueInOrder(activeEdgeChildren)
      .map((child) => edgeByChild.get(child))
      .filter((edgeId) => edgeId !== undefined),
    changedNodeIds: uniqueInOrder(changedNodes).map(graphNodeId),
    states: [
      ...unionFind.nodes
        .filter((node) => unionFind.parentOf(node) === node)
        .map((node) => ({ nodeId: graphNodeId(node), kind: "root", label: "component root" })),
      ...actionStates.map(({ node, kind, label }) => ({ nodeId: graphNodeId(node), kind, label }))
    ],
    annotations: [...annotationByNode].map(([node, label]) => ({
      nodeId: graphNodeId(node),
      label
    }))
  };
}

function createParentLookupView({ unionFind, activeKeys, resultKeys, actionAnnotations }) {
  const annotationByNode = rootAnnotations(unionFind);
  for (const { node, label } of actionAnnotations) annotationByNode.set(node, label);
  return {
    entries: unionFind.nodes.map((node) => ({
      key: node,
      value: unionFind.parentOf(node),
      state: unionFind.parentOf(node) === node ? "root" : "child"
    })),
    activeKeys: uniqueInOrder(activeKeys),
    annotations: [...annotationByNode].map(([key, label]) => ({ key, label })),
    resultKeys: uniqueInOrder(resultKeys)
  };
}

function rootAnnotations(unionFind) {
  return new Map(unionFind.nodes
    .filter((node) => unionFind.parentOf(node) === node)
    .map((node) => [node, `root · size ${unionFind.sizeOfRoot(node)}`]));
}

function uniqueInOrder(values) {
  return [...new Set(values)];
}
