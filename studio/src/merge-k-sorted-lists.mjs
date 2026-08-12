import { createLinkedList } from "../../linked-lists/model.mjs";
import {
  createFrontierEntry,
  mergeKSortedLists,
  popFrontier,
  pushFrontier,
  validateKSortedLists
} from "../../heaps-and-priority-queues/merge-k-sorted-lists.mjs";
import { formatNumber } from "./input.mjs";

export { mergeKSortedLists };

export function buildMergeKSortedListsTrace(lists) {
  validateKSortedLists(lists);
  const heads = lists.map((values) => createLinkedList(values));
  const frontier = [];
  const output = [];
  const trace = [];
  const totalNodes = lists.reduce((total, list) => total + list.length, 0);

  for (let listIndex = 0; listIndex < heads.length; listIndex += 1) {
    pushFrontier(frontier, createFrontierEntry(heads[listIndex], listIndex, 0));
  }
  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-frontier"],
    frontier,
    output,
    listCount: lists.length,
    totalNodes,
    extractedEntry: null,
    activeFrontierId: frontier[0].id,
    changedFrontierIds: frontier.map(({ id }) => id),
    narration: `Push one head from each of the ${lists.length} sorted source lists. The heap root is the smallest frontier value.`,
    prompt: "Why is no value behind a source head eligible yet?"
  }));

  while (frontier.length > 0) {
    const minimum = frontier[0];
    trace.push(createStep({
      trace,
      phase: "extract-min",
      codeSteps: ["extract-min"],
      frontier,
      output,
      listCount: lists.length,
      totalNodes,
      extractedEntry: minimum,
      activeFrontierId: minimum.id,
      narration: `The heap root ${formatNumber(minimum.value)} from list ${minimum.listIndex + 1} is the smallest eligible value.`,
      prompt: "After extracting this node, which value from the same source list becomes eligible?"
    }));

    const extracted = popFrontier(frontier);
    output.push(extracted.value);
    trace.push(createStep({
      trace,
      phase: "append-output",
      codeSteps: ["append-output"],
      frontier,
      output,
      listCount: lists.length,
      totalNodes,
      extractedEntry: extracted,
      activeOutputIndex: output.length - 1,
      changedOutputIndices: [output.length - 1],
      narration: `Extract ${formatNumber(extracted.value)} and append it at merged output index ${output.length - 1}.`,
      prompt: "Does this source list still have a successor to add to the frontier?"
    }));

    if (extracted.node.next !== null) {
      const successor = createFrontierEntry(
        extracted.node.next,
        extracted.listIndex,
        extracted.elementIndex + 1
      );
      pushFrontier(frontier, successor);
      trace.push(createStep({
        trace,
        phase: "push-successor",
        codeSteps: ["advance-list", "push-successor"],
        frontier,
        output,
        listCount: lists.length,
        totalNodes,
        extractedEntry: extracted,
        successorEntry: successor,
        activeFrontierId: successor.id,
        changedFrontierIds: [successor.id],
        narration: `Advance list ${extracted.listIndex + 1} to item ${successor.elementIndex + 1} and push ${formatNumber(successor.value)} into the frontier.`,
        prompt: "How can this new value change the heap root without exposing any later source value?"
      }));
      continue;
    }

    trace.push(createStep({
      trace,
      phase: "list-exhausted",
      codeSteps: ["advance-list", "skip-exhausted"],
      frontier,
      output,
      listCount: lists.length,
      totalNodes,
      extractedEntry: extracted,
      narration: `List ${extracted.listIndex + 1} is exhausted, so no successor enters the frontier.`,
      prompt: "Which remaining list head can now be the global minimum?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-output"],
      frontier,
      output,
      listCount: lists.length,
      totalNodes,
      extractedEntry: null,
      markOutputResult: true,
      narration: `The frontier is empty after merging all ${totalNodes} nodes in nondecreasing order.`,
      prompt: "Why did the frontier never need more than one node per source list?"
    }),
    result: [...output]
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  frontier,
  output,
  listCount,
  totalNodes,
  extractedEntry,
  narration,
  prompt,
  successorEntry = null,
  activeFrontierId = null,
  changedFrontierIds = [],
  activeOutputIndex = null,
  changedOutputIndices = [],
  markOutputResult = false
}) {
  const frontierView = createFrontierView({
    frontier,
    activeFrontierId,
    changedFrontierIds
  });
  const outputMarkers = markOutputResult
    ? output.map((_, index) => ({ index, kind: "result", label: "merged" }))
    : activeOutputIndex === null
      ? []
      : [{ index: activeOutputIndex, kind: "output", label: "just appended" }];
  return {
    step: trace.length,
    phase,
    codeSteps,
    listCount,
    totalNodes,
    outputCount: output.length,
    remainingCount: totalNodes - output.length,
    frontierSize: frontier.length,
    extractedValue: extractedEntry?.value ?? null,
    extractedListIndex: extractedEntry?.listIndex ?? null,
    extractedElementIndex: extractedEntry?.elementIndex ?? null,
    successorValue: successorEntry?.value ?? null,
    successorElementIndex: successorEntry?.elementIndex ?? null,
    views: {
      frontier: frontierView,
      output: {
        values: [...output],
        activeIndices: activeOutputIndex === null ? [] : [activeOutputIndex],
        ranges: [],
        markers: outputMarkers.map((marker) => ({ ...marker })),
        annotations: activeOutputIndex === null
          ? []
          : [{ index: activeOutputIndex, label: `output ${activeOutputIndex}` }],
        changedIndices: [...changedOutputIndices]
      }
    },
    narration,
    prompt
  };
}

function createFrontierView({ frontier, activeFrontierId, changedFrontierIds }) {
  return {
    nodes: frontier.map(({ id, value }) => ({ id, value })),
    edges: frontier.slice(1).map((entry, childIndexOffset) => {
      const childIndex = childIndexOffset + 1;
      const parentIndex = Math.floor((childIndex - 1) / 2);
      return {
        id: `heap-edge-${parentIndex}-${childIndex}`,
        fromId: frontier[parentIndex].id,
        toId: entry.id,
        label: childIndex % 2 === 1 ? "left" : "right"
      };
    }),
    rootIds: frontier.length === 0 ? [] : [frontier[0].id],
    activeNodeIds: activeFrontierId === null ? [] : [activeFrontierId],
    changedNodeIds: [...changedFrontierIds],
    states: frontier.map(({ id }) => ({ nodeId: id, kind: "frontier", label: "eligible head" })),
    annotations: frontier.map(({ id, listIndex, elementIndex }) => ({
      nodeId: id,
      label: `list ${listIndex + 1}, item ${elementIndex + 1}`
    })),
    pointers: activeFrontierId === null ? [] : [{
      nodeId: activeFrontierId,
      kind: "current",
      label: "current frontier item"
    }]
  };
}
