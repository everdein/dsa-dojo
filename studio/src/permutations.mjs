import {
  generatePermutations,
  validatePermutationValues
} from "../../backtracking/permutations.mjs";
import { formatNumber } from "./input.mjs";

export { generatePermutations };

export function buildPermutationsTrace(values) {
  validatePermutationValues(values);
  const used = Array(values.length).fill(false);
  const path = [];
  const results = [];
  const treeNodes = [createTreeNode("choice-root", "start", null)];
  const treeEdges = [];
  const recordedTreeNodeIds = new Set();
  const trace = [];
  let decisionCount = 0;
  let currentTreeNodeId = "choice-root";

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    values,
    used,
    path,
    results,
    treeNodes,
    treeEdges,
    recordedTreeNodeIds,
    decisionCount,
    currentTreeNodeId,
    valueIndex: null,
    narration: "Start with an empty path. Every input value is still available as the first choice.",
    prompt: "Which value will input-order DFS choose first?"
  }));

  function visit(parentTreeNodeId) {
    trace.push(createStep({
      trace,
      phase: "recurse",
      codeSteps: ["recurse", "check-complete"],
      values,
      used,
      path,
      results,
      treeNodes,
      treeEdges,
      recordedTreeNodeIds,
      decisionCount,
      currentTreeNodeId: parentTreeNodeId,
      valueIndex: null,
      narration: path.length === values.length
        ? `The path has ${path.length} values, so this recursive call reached a complete permutation.`
        : `Recurse at depth ${path.length}. Choose the first unused value in input order.`,
      prompt: path.length === values.length
        ? "What must be copied before this path is undone?"
        : "Which values remain available at this depth?"
    }));

    if (path.length === values.length) {
      results.push([...path]);
      recordedTreeNodeIds.add(parentTreeNodeId);
      trace.push(createStep({
        trace,
        phase: "record",
        codeSteps: ["record"],
        values,
        used,
        path,
        results,
        treeNodes,
        treeEdges,
        recordedTreeNodeIds,
        decisionCount,
        currentTreeNodeId: parentTreeNodeId,
        valueIndex: null,
        recordIndex: results.length - 1,
        narration: `Record permutation ${formatPath(path)} as result ${results.length}.`,
        prompt: "Why must the algorithm record a copy instead of the mutable path itself?"
      }));
      return;
    }

    for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
      if (used[valueIndex]) continue;
      const value = values[valueIndex];
      const treeNodeId = `choice-${decisionCount}`;
      const edgeId = `choice-edge-${decisionCount}`;
      decisionCount += 1;
      used[valueIndex] = true;
      path.push(value);
      treeNodes.push(createTreeNode(treeNodeId, value, valueIndex, path.length));
      treeEdges.push({
        id: edgeId,
        fromId: parentTreeNodeId,
        toId: treeNodeId,
        label: `choose ${formatNumber(value)}`
      });
      currentTreeNodeId = treeNodeId;

      trace.push(createStep({
        trace,
        phase: "choose",
        codeSteps: ["scan-choices", "choose"],
        values,
        used,
        path,
        results,
        treeNodes,
        treeEdges,
        recordedTreeNodeIds,
        decisionCount,
        currentTreeNodeId,
        activeEdgeId: edgeId,
        changedTreeNodeId: treeNodeId,
        valueIndex,
        narration: `Choose ${formatNumber(value)} at source index ${valueIndex}; the path is now ${formatPath(path)}.`,
        prompt: path.length === values.length
          ? "Has this choice completed a permutation?"
          : "What will the recursive call choose next?"
      }));

      visit(treeNodeId);

      const removedValue = path.pop();
      used[valueIndex] = false;
      currentTreeNodeId = parentTreeNodeId;
      trace.push(createStep({
        trace,
        phase: "undo",
        codeSteps: ["undo"],
        values,
        used,
        path,
        results,
        treeNodes,
        treeEdges,
        recordedTreeNodeIds,
        decisionCount,
        currentTreeNodeId,
        activeEdgeId: edgeId,
        changedTreeNodeId: treeNodeId,
        valueIndex,
        undoneValue: removedValue,
        narration: `Undo ${formatNumber(removedValue)}. Mark source index ${valueIndex} unused and restore path ${formatPath(path)}.`,
        prompt: "Which unused sibling choice should DFS explore next?"
      }));
    }
  }

  visit("choice-root");
  const result = generatePermutations(values);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-results"],
      values,
      used,
      path,
      results,
      treeNodes,
      treeEdges,
      recordedTreeNodeIds,
      decisionCount,
      currentTreeNodeId: "choice-root",
      valueIndex: null,
      markAllResults: true,
      narration: `Input-order DFS records all ${result.length} permutations, and every choice has been undone.`,
      prompt: "Why does choosing each unused value once at every depth produce every permutation exactly once?"
    }),
    result
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  used,
  path,
  results,
  treeNodes,
  treeEdges,
  recordedTreeNodeIds,
  decisionCount,
  currentTreeNodeId,
  valueIndex,
  narration,
  prompt,
  activeEdgeId = null,
  changedTreeNodeId = null,
  recordIndex = null,
  undoneValue = null,
  markAllResults = false
}) {
  const pathValues = [...path];
  const remainingIndices = values
    .map((_, index) => index)
    .filter((index) => !used[index]);
  return {
    step: trace.length,
    phase,
    codeSteps,
    depth: pathValues.length,
    decisionCount,
    permutationCount: results.length,
    valueIndex,
    currentValue: valueIndex === null ? null : values[valueIndex],
    undoneValue,
    recordIndex,
    path: [...pathValues],
    usedIndices: used.flatMap((isUsed, index) => isUsed ? [index] : []),
    remainingIndices: [...remainingIndices],
    results: results.map((result) => [...result]),
    views: {
      choices: {
        values: [...values],
        activeIndices: valueIndex === null ? [] : [valueIndex],
        ranges: [],
        markers: [
          ...used.flatMap((isUsed, index) => isUsed
            ? [{ index, kind: "used", label: "in current path" }]
            : [{ index, kind: "available", label: "available" }])
        ],
        annotations: valueIndex === null ? [] : [{
          index: valueIndex,
          label: phase === "undo" ? "restored" : "current choice"
        }],
        changedIndices: valueIndex === null ? [] : [valueIndex]
      },
      path: {
        values: [...pathValues],
        activeIndices: pathValues.length === 0 ? [] : [pathValues.length - 1],
        ranges: pathValues.length === 0 ? [] : [{
          start: 0,
          end: pathValues.length - 1,
          kind: "path",
          label: "current path"
        }],
        markers: pathValues.map((_, index) => ({
          index,
          kind: recordIndex === null ? "chosen" : "recorded",
          label: recordIndex === null ? `depth ${index + 1}` : `result ${recordIndex + 1}`
        })),
        annotations: [],
        changedIndices: pathValues.length === 0 || phase === "recurse" ? [] : [pathValues.length - 1]
      },
      tree: {
        nodes: treeNodes.map(({ id, value }) => ({ id, value })),
        edges: treeEdges.map((edge) => ({ ...edge })),
        rootIds: ["choice-root"],
        activeNodeIds: [currentTreeNodeId],
        changedNodeIds: changedTreeNodeId === null ? [] : [changedTreeNodeId],
        states: [
          ...[...recordedTreeNodeIds]
            .map((nodeId) => ({ nodeId, kind: "recorded", label: "complete permutation" })),
          { nodeId: currentTreeNodeId, kind: phase === "undo" ? "undo" : "current", label: phase === "undo" ? "undo choice" : "current call" }
        ],
        annotations: currentTreeNodeId === "choice-root"
          ? [{ nodeId: "choice-root", label: markAllResults ? `${results.length} results` : "empty path" }]
          : [{ nodeId: currentTreeNodeId, label: `depth ${pathValues.length}` }],
        pointers: [{
          nodeId: currentTreeNodeId,
          kind: phase === "undo" ? "backtrack" : "current",
          label: phase === "undo" ? "backtrack" : "DFS"
        }]
      }
    },
    narration,
    prompt
  };
}

function createTreeNode(id, value, valueIndex, depth = 0) {
  return { id, value, valueIndex, depth };
}

function formatPath(path) {
  return `[${path.map(formatNumber).join(", ")}]`;
}
