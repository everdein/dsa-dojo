import { graphNodeId } from "../../graphs/model.mjs";
import {
  runUnionFindProgram,
  UnionFind,
  validateUnionFindInput
} from "../../disjoint-sets/union-find.mjs";

export { runUnionFindProgram, UnionFind };

export function buildUnionFindFundamentalsTrace({ nodes, operations }) {
  validateUnionFindInput(nodes, operations);
  const unionFind = new UnionFind(nodes);
  const trace = [];
  let observationCount = 0;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    unionFind,
    operations,
    operationIndex: null,
    operation: null,
    observationCount,
    narration: `Initialize ${nodes.length} singleton components. Every node starts as its own parent with size 1.`,
    prompt: "Which roots should merge when the first union operation runs?"
  }));

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    if (operation.type === "find") {
      const details = traceFind({
        trace,
        unionFind,
        operations,
        operationIndex,
        operation,
        node: operation.node,
        operand: "find",
        observationCount
      });
      observationCount += 1;
      trace.push(createStep({
        trace,
        phase: "find-result",
        codeSteps: ["return-root"],
        unionFind,
        operations,
        operationIndex,
        operation,
        observationCount,
        path: details.path,
        root: details.root,
        activeNodes: [details.root],
        resultNodes: [details.root],
        actionAnnotations: [{ node: details.root, label: `find returns ${details.root}` }],
        narration: `Find ${operation.node} returns root ${details.root}.`,
        prompt: "How will path compression shorten a later find from this node?"
      }));
      continue;
    }

    const leftDetails = traceFind({
      trace,
      unionFind,
      operations,
      operationIndex,
      operation,
      node: operation.left,
      operand: "left",
      observationCount
    });
    const rightDetails = traceFind({
      trace,
      unionFind,
      operations,
      operationIndex,
      operation,
      node: operation.right,
      operand: "right",
      observationCount
    });
    const link = unionFind.unionRoots(leftDetails.root, rightDetails.root);
    observationCount += 1;

    if (!link.merged) {
      trace.push(createStep({
        trace,
        phase: "already-connected",
        codeSteps: ["union-roots", "already-connected"],
        unionFind,
        operations,
        operationIndex,
        operation,
        observationCount,
        root: link.root,
        activeNodes: [link.root],
        resultNodes: [link.root],
        actionAnnotations: [{
          node: link.root,
          label: `already connected · size ${link.size}`
        }],
        narration: `${operation.left} and ${operation.right} already share root ${link.root}, so parent links and component count stay unchanged.`,
        prompt: "Why must an already-connected union avoid changing the stored size?"
      }));
      continue;
    }

    trace.push(createStep({
      trace,
      phase: "union-roots",
      codeSteps: ["union-roots", "attach-smaller"],
      unionFind,
      operations,
      operationIndex,
      operation,
      observationCount,
      root: link.root,
      activeNodes: [link.root, link.attachedRoot],
      activeEdgeChildren: [link.attachedRoot],
      changedNodes: [link.root, link.attachedRoot],
      resultNodes: [link.root],
      actionStates: [
        { node: link.root, kind: "union-root", label: "larger root" },
        { node: link.attachedRoot, kind: "attached", label: "attached root" }
      ],
      actionAnnotations: [
        { node: link.root, label: `root · size ${link.size}` },
        { node: link.attachedRoot, label: `parent -> ${link.root}` }
      ],
      narration: `Attach root ${link.attachedRoot} beneath root ${link.root}. The winning component now has size ${link.size}.`,
      prompt: "How does attaching the smaller tree limit future path length?"
    }));
  }

  const result = runUnionFindProgram(nodes, operations);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-state"],
      unionFind,
      operations,
      operationIndex: null,
      operation: null,
      observationCount,
      resultNodes: nodes.filter((node) => unionFind.parentOf(node) === node),
      narration: `The program produced ${observationCount} observations and finished with ${unionFind.components} ${unionFind.components === 1 ? "component" : "components"}.`,
      prompt: "Where are sizes meaningful, and how will later finds flatten the remaining parent paths?"
    }),
    result
  });
  return trace;
}

function traceFind({
  trace,
  unionFind,
  operations,
  operationIndex,
  operation,
  node,
  operand,
  observationCount
}) {
  const inspected = unionFind.inspectFind(node);
  trace.push(createStep({
    trace,
    phase: "find-path",
    codeSteps: ["find-path"],
    unionFind,
    operations,
    operationIndex,
    operation,
    observationCount,
    operand,
    path: inspected.path,
    root: inspected.root,
    activeNodes: inspected.path,
    activeEdgeChildren: inspected.path.slice(0, -1),
    actionStates: inspected.path.map((pathNode) => ({
      node: pathNode,
      kind: "find-path",
      label: "find path"
    })),
    actionAnnotations: [{ node: inspected.root, label: `root ${inspected.root}` }],
    narration: `${operandLabel(operand)}Find ${node} follows ${inspected.path.join(" -> ")} to root ${inspected.root}.`,
    prompt: inspected.compressed.length === 0
      ? "Is this path already direct?"
      : `Which ${inspected.compressed.length === 1 ? "node" : "nodes"} can point straight to ${inspected.root}?`
  }));

  const details = unionFind.findWithDetails(node);
  if (details.compressed.length > 0) {
    trace.push(createStep({
      trace,
      phase: "compress-path",
      codeSteps: ["compress-path"],
      unionFind,
      operations,
      operationIndex,
      operation,
      observationCount,
      operand,
      path: details.path,
      root: details.root,
      compressedNodes: details.compressed,
      activeNodes: details.path,
      activeEdgeChildren: details.compressed,
      changedNodes: details.compressed,
      resultNodes: [details.root],
      actionStates: details.compressed.map((pathNode) => ({
        node: pathNode,
        kind: "compressed",
        label: "path compressed"
      })),
      actionAnnotations: details.compressed.map((pathNode) => ({
        node: pathNode,
        label: `parent -> ${details.root}`
      })),
      narration: `Point ${details.compressed.join(", ")} directly to root ${details.root}.`,
      prompt: "What will the next find from a compressed node cost along this path?"
    }));
  }
  return details;
}

function createStep({
  trace,
  phase,
  codeSteps,
  unionFind,
  operations,
  operationIndex,
  operation,
  observationCount,
  narration,
  prompt,
  operand = null,
  path = [],
  root = null,
  compressedNodes = [],
  activeNodes = [],
  activeEdgeChildren = [],
  changedNodes = [],
  resultNodes = [],
  actionStates = [],
  actionAnnotations = []
}) {
  const snapshot = unionFind.snapshot();
  return {
    step: trace.length,
    phase,
    codeSteps,
    operationIndex,
    operationCount: operations.length,
    operationType: operation?.type ?? null,
    operationLabel: formatOperation(operation),
    operand,
    path: [...path],
    pathLength: path.length,
    root,
    compressedNodes: [...compressedNodes],
    compressedCount: compressedNodes.length,
    observationCount,
    components: snapshot.components,
    parent: { ...snapshot.parent },
    size: { ...snapshot.size },
    views: {
      forest: createForestView({
        unionFind,
        activeNodes,
        activeEdgeChildren,
        changedNodes,
        actionStates,
        actionAnnotations
      }),
      parents: createParentLookupView({
        unionFind,
        activeNodes,
        resultNodes,
        actionAnnotations
      })
    },
    narration,
    prompt
  };
}

function createForestView({
  unionFind,
  activeNodes,
  activeEdgeChildren,
  changedNodes,
  actionStates,
  actionAnnotations
}) {
  const nodes = unionFind.nodes;
  const edgeByChild = new Map();
  const edges = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const child = nodes[index];
    const parent = unionFind.parentOf(child);
    if (child === parent) continue;
    const edge = {
      id: `parent-edge-${index}`,
      fromId: graphNodeId(child),
      toId: graphNodeId(parent),
      label: "parent"
    };
    edges.push(edge);
    edgeByChild.set(child, edge.id);
  }

  const annotationByNode = rootAnnotations(unionFind);
  for (const { node, label } of actionAnnotations) annotationByNode.set(node, label);
  return {
    structure: "graph",
    directed: true,
    nodes: nodes.map((node) => ({ id: graphNodeId(node), value: node })),
    edges,
    activeNodeIds: uniqueInOrder(activeNodes).map(graphNodeId),
    activeEdgeIds: uniqueInOrder(activeEdgeChildren)
      .map((child) => edgeByChild.get(child))
      .filter((edgeId) => edgeId !== undefined),
    changedNodeIds: uniqueInOrder(changedNodes).map(graphNodeId),
    states: [
      ...nodes
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

function createParentLookupView({ unionFind, activeNodes, resultNodes, actionAnnotations }) {
  const annotationByNode = rootAnnotations(unionFind);
  for (const { node, label } of actionAnnotations) annotationByNode.set(node, label);
  return {
    entries: unionFind.nodes.map((node) => ({
      key: node,
      value: unionFind.parentOf(node),
      state: unionFind.parentOf(node) === node ? "root" : "child"
    })),
    activeKeys: uniqueInOrder(activeNodes),
    annotations: [...annotationByNode].map(([key, label]) => ({ key, label })),
    resultKeys: uniqueInOrder(resultNodes)
  };
}

function rootAnnotations(unionFind) {
  return new Map(unionFind.nodes
    .filter((node) => unionFind.parentOf(node) === node)
    .map((node) => [node, `root · size ${unionFind.sizeOfRoot(node)}`]));
}

function formatOperation(operation) {
  if (operation === null) return "-";
  return operation.type === "find"
    ? `find ${operation.node}`
    : `union ${operation.left} ${operation.right}`;
}

function operandLabel(operand) {
  if (operand === "left") return "Find the left operand root. ";
  if (operand === "right") return "Find the right operand root. ";
  return "";
}

function uniqueInOrder(values) {
  return [...new Set(values)];
}
