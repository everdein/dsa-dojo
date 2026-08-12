import {
  mergeSort,
  validateMergeSortInput
} from "../../sorting/merge-sort.mjs";
import { formatNumber } from "./input.mjs";

export { mergeSort };

export function buildMergeSortTrace(values) {
  validateMergeSortInput(values);
  const working = [...values];
  const trace = [];
  const { nodes, edges, rootId } = buildRangeTree(values.length);
  const completed = new Set();
  let splits = 0;
  let merges = 0;
  let comparisons = 0;
  let writes = 0;
  let auxiliarySize = 0;

  const addStep = ({ phase, codeSteps, start, end, changedIndices = [], annotations = [], treeAnnotation = null, narration, prompt, result }) => {
    const activeId = rangeNodeId(start, end);
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      splits,
      merges,
      comparisons,
      writes,
      auxiliarySize,
      activeRange: [start, end],
      views: {
        values: {
          values: [...working],
          activeIndices: Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
          ranges: [{ start, end, kind: "candidate", label: "active subarray" }],
          markers: [],
          annotations: annotations.map((annotation) => ({ ...annotation })),
          changedIndices: [...changedIndices]
        },
        calls: {
          nodes: nodes.map((node) => ({ ...node })),
          edges: edges.map((edge) => ({ ...edge })),
          rootIds: [rootId],
          activeNodeIds: [activeId],
          changedNodeIds: [...changedIndices.length ? [activeId] : []],
          states: [...completed].map((nodeId) => ({ nodeId, kind: "merged", label: "sorted range" })),
          annotations: treeAnnotation === null ? [] : [{ nodeId: activeId, label: treeAnnotation }],
          pointers: [{ nodeId: activeId, kind: "current", label: "active call" }]
        }
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  const sortRange = (start, end) => {
    if (start === end) {
      completed.add(rangeNodeId(start, end));
      addStep({
        phase: "base-case",
        codeSteps: ["check-base", "return-singleton"],
        start,
        end,
        treeAnnotation: `singleton ${formatNumber(working[start])}`,
        narration: `Range ${start}-${end} contains one value, so it is already sorted.`,
        prompt: "Which waiting merge will consume this singleton?"
      });
      return;
    }

    const middle = Math.floor((start + end) / 2);
    splits += 1;
    addStep({
      phase: "divide",
      codeSteps: ["split", "recurse-left", "recurse-right"],
      start,
      end,
      treeAnnotation: `split after index ${middle}`,
      narration: `Divide range ${start}-${end} into ${start}-${middle} and ${middle + 1}-${end}.`,
      prompt: "Why does dividing continue until every range is a singleton?"
    });
    sortRange(start, middle);
    sortRange(middle + 1, end);

    const left = working.slice(start, middle + 1);
    const right = working.slice(middle + 1, end + 1);
    auxiliarySize = left.length + right.length;
    addStep({
      phase: "prepare-merge",
      codeSteps: ["copy-halves"],
      start,
      end,
      annotations: [
        { index: start, label: `left [${left.map(formatNumber).join(", ")}]` },
        { index: middle + 1, label: `right [${right.map(formatNumber).join(", ")}]` }
      ],
      treeAnnotation: `merge ${left.length} + ${right.length}`,
      narration: `Copy both sorted halves before writing their values back in order.`,
      prompt: "Which front value is smaller?"
    });

    let leftIndex = 0;
    let rightIndex = 0;
    let writeIndex = start;
    while (leftIndex < left.length || rightIndex < right.length) {
      const compareBoth = leftIndex < left.length && rightIndex < right.length;
      if (compareBoth) comparisons += 1;
      const takeLeft = rightIndex >= right.length || (leftIndex < left.length && left[leftIndex] <= right[rightIndex]);
      const next = takeLeft ? left[leftIndex++] : right[rightIndex++];
      working[writeIndex] = next;
      writes += 1;
      addStep({
        phase: takeLeft ? "take-left" : "take-right",
        codeSteps: ["compare-fronts", takeLeft ? "write-left" : "write-right"],
        start,
        end,
        changedIndices: [writeIndex],
        annotations: [{ index: writeIndex, label: `write ${formatNumber(next)}` }],
        treeAnnotation: `${writes} total writes`,
        narration: `Write ${formatNumber(next)} at index ${writeIndex} from the ${takeLeft ? "left" : "right"} buffer.`,
        prompt: "Which remaining buffer front should be written next?"
      });
      writeIndex += 1;
    }
    merges += 1;
    completed.add(rangeNodeId(start, end));
    auxiliarySize = 0;
    addStep({
      phase: "finish-merge",
      codeSteps: ["return-merged"],
      start,
      end,
      treeAnnotation: `sorted [${working.slice(start, end + 1).map(formatNumber).join(", ")}]`,
      narration: `Range ${start}-${end} is now sorted and can return to its parent call.`,
      prompt: "What invariant lets the parent merge trust this range?"
    });
  };

  sortRange(0, working.length - 1);
  addStep({
    phase: "complete",
    codeSteps: ["return-merged"],
    start: 0,
    end: working.length - 1,
    treeAnnotation: "fully sorted",
    narration: `All ${merges} nontrivial ranges have merged into one sorted array.`,
    prompt: "Where does Merge Sort spend its O(n) auxiliary space?",
    result: [...working]
  });
  return trace;
}

function buildRangeTree(length) {
  const nodes = [];
  const edges = [];
  let nextEdge = 0;
  const visit = (start, end, parentId = null, label = null) => {
    const id = rangeNodeId(start, end);
    nodes.push({ id, value: start === end ? `${start}` : `${start}-${end}` });
    if (parentId !== null) {
      edges.push({ id: `edge-${nextEdge}`, fromId: parentId, toId: id, label });
      nextEdge += 1;
    }
    if (start === end) return;
    const middle = Math.floor((start + end) / 2);
    visit(start, middle, id, "left");
    visit(middle + 1, end, id, "right");
  };
  visit(0, length - 1);
  return { nodes, edges, rootId: rangeNodeId(0, length - 1) };
}

function rangeNodeId(start, end) {
  return `range-${start}-${end}`;
}
