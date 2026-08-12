import { graphNodeId } from "../../graphs/model.mjs";
import {
  runConnectivityQueries,
  validateConnectivityInput
} from "../../disjoint-sets/connectivity-queries.mjs";
import { UnionFind } from "../../disjoint-sets/union-find.mjs";

export { runConnectivityQueries };

export function buildConnectivityQueriesTrace({ nodes, operations }) {
  validateConnectivityInput(nodes, operations);
  const unionFind = new UnionFind(nodes);
  const answers = [];
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    unionFind,
    operations,
    operationIndex: null,
    operation: null,
    answers,
    narration: `Initialize ${nodes.length} singleton components. Every node is a root with size 1.`,
    prompt: "Which roots will the first operation inspect?"
  }));

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    const leftDetails = traceFind({
      trace,
      unionFind,
      operations,
      operationIndex,
      operation,
      answers,
      node: operation.left,
      operand: "left"
    });
    const rightDetails = traceFind({
      trace,
      unionFind,
      operations,
      operationIndex,
      operation,
      answers,
      node: operation.right,
      operand: "right"
    });

    if (operation.type === "connected") {
      const connected = leftDetails.root === rightDetails.root;
      const answer = {
        operationIndex,
        left: operation.left,
        right: operation.right,
        connected
      };
      answers.push(answer);
      const queryNodes = uniqueInOrder([operation.left, operation.right]);
      trace.push(createStep({
        trace,
        phase: "connectivity-result",
        codeSteps: ["compare-roots", "record-answer"],
        unionFind,
        operations,
        operationIndex,
        operation,
        answers,
        leftRoot: leftDetails.root,
        rightRoot: rightDetails.root,
        connected,
        activeNodes: uniqueInOrder([
          operation.left,
          operation.right,
          leftDetails.root,
          rightDetails.root
        ]),
        activeEdgeChildren: queryNodes.filter((node) => unionFind.parentOf(node) !== node),
        changedNodes: queryNodes,
        resultNodes: queryNodes,
        actionStates: queryNodes.map((node) => ({
          node,
          kind: connected ? "connected" : "separate",
          label: connected ? "same representative" : "different representative"
        })),
        actionAnnotations: uniqueNodeAnnotations([
          { node: operation.left, label: `root ${leftDetails.root}` },
          { node: operation.right, label: `root ${rightDetails.root}` }
        ]),
        narration: connected
          ? `${operation.left} and ${operation.right} both resolve to ${leftDetails.root}, so record true.`
          : `${operation.left} resolves to ${leftDetails.root}, while ${operation.right} resolves to ${rightDetails.root}, so record false.`,
        prompt: connected
          ? "How will compression shorten a repeated query between these nodes?"
          : "Which future union could make this same query return true?"
      }));
      continue;
    }

    const leftSize = unionFind.sizeOfRoot(leftDetails.root);
    const rightSize = unionFind.sizeOfRoot(rightDetails.root);
    const link = unionFind.unionRoots(leftDetails.root, rightDetails.root);
    if (!link.merged) {
      trace.push(createStep({
        trace,
        phase: "already-connected",
        codeSteps: ["compare-sizes", "already-connected"],
        unionFind,
        operations,
        operationIndex,
        operation,
        answers,
        leftRoot: leftDetails.root,
        rightRoot: rightDetails.root,
        winningRoot: link.root,
        winningSize: link.size,
        activeNodes: uniqueInOrder([operation.left, operation.right, link.root]),
        resultNodes: [link.root],
        actionStates: [{ node: link.root, kind: "union-root", label: "shared root" }],
        actionAnnotations: [{ node: link.root, label: `unchanged size ${link.size}` }],
        narration: `${operation.left} and ${operation.right} already share root ${link.root}. No parent or size changes.`,
        prompt: "Why must a redundant union leave the component count unchanged?"
      }));
      continue;
    }

    const attachedSize = link.attachedRoot === leftDetails.root ? leftSize : rightSize;
    const winnerSizeBefore = link.root === leftDetails.root ? leftSize : rightSize;
    trace.push(createStep({
      trace,
      phase: "union-by-size",
      codeSteps: ["compare-sizes", "attach-smaller"],
      unionFind,
      operations,
      operationIndex,
      operation,
      answers,
      leftRoot: leftDetails.root,
      rightRoot: rightDetails.root,
      winningRoot: link.root,
      attachedRoot: link.attachedRoot,
      winningSize: link.size,
      activeNodes: [link.root, link.attachedRoot],
      activeEdgeChildren: [link.attachedRoot],
      changedNodes: [link.root, link.attachedRoot],
      resultNodes: [link.root],
      actionStates: [
        { node: link.root, kind: "union-root", label: "larger root" },
        { node: link.attachedRoot, kind: "attached", label: "smaller root attached" }
      ],
      actionAnnotations: [
        { node: link.root, label: `size ${winnerSizeBefore} -> ${link.size}` },
        { node: link.attachedRoot, label: `size ${attachedSize} attaches here` }
      ],
      narration: winnerSizeBefore === attachedSize
        ? `The roots tie at size ${winnerSizeBefore}, so the left root ${link.root} wins deterministically and ${link.attachedRoot} attaches beneath it.`
        : `Root ${link.attachedRoot} has size ${attachedSize}, so attach it beneath larger root ${link.root}, previously size ${winnerSizeBefore}.`,
      prompt: "How does attaching the smaller root limit the height of the parent forest?"
    }));
  }

  const final = unionFind.snapshot();
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-result"],
      unionFind,
      operations,
      operationIndex: null,
      operation: null,
      answers,
      resultNodes: nodes.filter((node) => unionFind.parentOf(node) === node),
      narration: `The program answered ${answers.length} connectivity ${answers.length === 1 ? "query" : "queries"} and finished with ${unionFind.components} ${unionFind.components === 1 ? "component" : "components"}.`,
      prompt: "Which parent paths are now shorter because a query traversed and compressed them?"
    }),
    result: {
      answers: answers.map((answer) => ({ ...answer })),
      final: {
        parent: { ...final.parent },
        size: { ...final.size },
        components: final.components
      }
    }
  });

  return trace;
}

function traceFind({
  trace,
  unionFind,
  operations,
  operationIndex,
  operation,
  answers,
  node,
  operand
}) {
  const inspected = unionFind.inspectFind(node);
  trace.push(createStep({
    trace,
    phase: "find-path",
    codeSteps: ["find-root"],
    unionFind,
    operations,
    operationIndex,
    operation,
    answers,
    operand,
    path: inspected.path,
    root: inspected.root,
    activeNodes: inspected.path,
    activeEdgeChildren: inspected.path.slice(0, -1),
    actionStates: inspected.path.map((pathNode) => ({
      node: pathNode,
      kind: "find-path",
      label: `${operand} find path`
    })),
    actionAnnotations: [{ node: inspected.root, label: `representative ${inspected.root}` }],
    narration: `${capitalize(operand)} find follows ${inspected.path.join(" -> ")} from ${node} to representative ${inspected.root}.`,
    prompt: inspected.compressed.length
      ? `Which ${inspected.compressed.length === 1 ? "node" : "nodes"} can point directly to ${inspected.root}?`
      : "Is this path already as direct as path compression can make it?"
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
      answers,
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
        label: "rewired directly to root"
      })),
      actionAnnotations: details.compressed.map((pathNode) => ({
        node: pathNode,
        label: `parent -> ${details.root}`
      })),
      narration: `Compress ${details.compressed.join(", ")} directly to ${details.root}. The next query will traverse fewer parent edges.`,
      prompt: "What remains unchanged about the represented component after rewiring these parents?"
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
  answers,
  narration,
  prompt,
  operand = null,
  path = [],
  root = null,
  compressedNodes = [],
  leftRoot = null,
  rightRoot = null,
  connected = null,
  winningRoot = null,
  attachedRoot = null,
  winningSize = null,
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
    codeSteps: [...codeSteps],
    operationIndex,
    operationCount: operations.length,
    operation: operation === null ? null : { ...operation },
    operationType: operation?.type ?? null,
    operationLabel: formatOperation(operation),
    operand,
    path: [...path],
    pathLength: path.length,
    root,
    compressedNodes: [...compressedNodes],
    compressedCount: compressedNodes.length,
    leftRoot,
    rightRoot,
    connected,
    winningRoot,
    attachedRoot,
    winningSize,
    answers: answers.map((answer) => ({ ...answer })),
    answerCount: answers.length,
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
  const edgeByChild = new Map();
  const edges = [];
  for (let index = 0; index < unionFind.nodes.length; index += 1) {
    const child = unionFind.nodes[index];
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
    nodes: unionFind.nodes.map((node) => ({ id: graphNodeId(node), value: node })),
    edges,
    activeNodeIds: uniqueInOrder(activeNodes).map(graphNodeId),
    activeEdgeIds: uniqueInOrder(activeEdgeChildren)
      .map((child) => edgeByChild.get(child))
      .filter((edgeId) => edgeId !== undefined),
    changedNodeIds: uniqueInOrder(changedNodes).map(graphNodeId),
    states: uniqueStates([
      ...unionFind.nodes
        .filter((node) => unionFind.parentOf(node) === node)
        .map((node) => ({ nodeId: graphNodeId(node), kind: "root", label: "component root" })),
      ...actionStates.map(({ node, kind, label }) => ({ nodeId: graphNodeId(node), kind, label }))
    ]),
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
    .map((node) => [node, `root | size ${unionFind.sizeOfRoot(node)}`]));
}

function formatOperation(operation) {
  if (operation === null) return "-";
  return `${operation.type} ${operation.left} ${operation.right}`;
}

function uniqueInOrder(values) {
  return [...new Set(values)];
}

function uniqueNodeAnnotations(annotations) {
  const byNode = new Map();
  for (const annotation of annotations) byNode.set(annotation.node, annotation);
  return [...byNode.values()];
}

function uniqueStates(states) {
  const byKey = new Map();
  for (const state of states) byKey.set(`${state.nodeId}:${state.kind}`, state);
  return [...byKey.values()];
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
