import {
  selectActivities,
  sortActivitiesByFinish,
  validateActivityIntervals
} from "../../greedy/activity-selection.mjs";
import { maximumGridRows } from "./grid-renderer.mjs";
import { formatNumber } from "./input.mjs";

export { selectActivities };

export function buildActivitySelectionTrace(intervals) {
  validateActivityIntervals(intervals);
  const sorted = sortActivitiesByFinish(intervals);
  const statusById = new Map(sorted.map(({ id }) => [id, "pending"]));
  const selected = [];
  const trace = [];
  let lastFinish = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["sort-by-finish"],
    sorted,
    statusById,
    selected,
    currentSortedIndex: null,
    lastFinish,
    compatible: null,
    processedCount: 0,
    narration: "Sort a copied schedule by earliest finish, then by start and original input index for deterministic ties. Original activity identities stay attached.",
    prompt: "Why does the earliest finish leave at least as much room as any other first choice?"
  }));

  for (let sortedIndex = 0; sortedIndex < sorted.length; sortedIndex += 1) {
    const activity = sorted[sortedIndex];
    const canAccept = lastFinish === null || activity.start >= lastFinish;

    trace.push(createStep({
      trace,
      phase: "consider",
      codeSteps: ["scan", "check-compatible"],
      sorted,
      statusById,
      selected,
      currentSortedIndex: sortedIndex,
      lastFinish,
      compatible: null,
      processedCount: sortedIndex,
      narration: lastFinish === null
        ? `Consider ${activity.id} ${formatActivity(activity)}. Nothing has been selected, so there is no finish-time boundary yet.`
        : `Consider ${activity.id} ${formatActivity(activity)} against the last accepted finish ${formatNumber(lastFinish)}.`,
      prompt: lastFinish === null
        ? "Should the earliest-finishing activity become the first selection?"
        : `Is start ${formatNumber(activity.start)} at or after ${formatNumber(lastFinish)}?`
    }));

    if (canAccept) {
      const previousFinish = lastFinish;
      statusById.set(activity.id, "accepted");
      selected.push({ ...activity });
      lastFinish = activity.end;
      trace.push(createStep({
        trace,
        phase: "accept",
        codeSteps: ["accept", "advance-finish"],
        sorted,
        statusById,
        selected,
        currentSortedIndex: sortedIndex,
        lastFinish,
        previousFinish,
        compatible: true,
        processedCount: sortedIndex + 1,
        narration: previousFinish === null
          ? `Accept ${activity.id}; its finish ${formatNumber(activity.end)} becomes the schedule boundary. An optimal schedule can exchange its first choice for this earliest finisher without losing later room.`
          : `Accept ${activity.id} because ${formatNumber(activity.start)} >= ${formatNumber(previousFinish)}. Advance the boundary to finish ${formatNumber(activity.end)}.`,
        prompt: "Which remaining compatible activity now finishes earliest?"
      }));
      continue;
    }

    statusById.set(activity.id, "rejected");
    trace.push(createStep({
      trace,
      phase: "reject",
      codeSteps: ["reject"],
      sorted,
      statusById,
      selected,
      currentSortedIndex: sortedIndex,
      lastFinish,
      compatible: false,
      processedCount: sortedIndex + 1,
      narration: `Reject ${activity.id} because start ${formatNumber(activity.start)} is before the accepted boundary ${formatNumber(lastFinish)}. It overlaps the current greedy schedule.`,
      prompt: "Why can rejecting this overlap never make the selected schedule shorter than choosing it instead?"
    }));
  }

  const result = selectActivities(intervals);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return-selected"],
      sorted,
      statusById,
      selected,
      currentSortedIndex: null,
      lastFinish,
      compatible: null,
      processedCount: sorted.length,
      narration: `The finish-time scan accepts ${selected.length} of ${sorted.length} ${sorted.length === 1 ? "activity" : "activities"}. Each exchange for an earlier finisher preserves or expands the time available afterward.`,
      prompt: "State the exchange argument: why can an optimal schedule safely begin with the greedy first activity?"
    }),
    result: result.map((activity) => ({ ...activity }))
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  sorted,
  statusById,
  selected,
  currentSortedIndex,
  lastFinish,
  compatible,
  processedCount,
  narration,
  prompt,
  previousFinish = null
}) {
  const currentActivity = currentSortedIndex === null ? null : sorted[currentSortedIndex];
  const viewport = createActivityViewport({
    sorted,
    statusById,
    selected,
    currentSortedIndex,
    phase,
    lastFinish,
    previousFinish
  });
  const acceptedCount = selected.length;
  const rejectedCount = [...statusById.values()].filter((status) => status === "rejected").length;
  return {
    step: trace.length,
    phase,
    codeSteps: [...codeSteps],
    currentSortedIndex,
    currentActivity: cloneActivity(currentActivity),
    currentActivityId: currentActivity?.id ?? null,
    lastFinish,
    previousFinish,
    compatible,
    processedCount,
    sourceCount: sorted.length,
    acceptedCount,
    rejectedCount,
    pendingCount: sorted.length - acceptedCount - rejectedCount,
    selected: selected.map((activity) => ({ ...activity })),
    statusById: Object.fromEntries(statusById),
    visibleStart: viewport.visibleStart,
    visibleEnd: viewport.visibleEnd,
    hiddenBefore: viewport.visibleStart,
    hiddenAfter: sorted.length - viewport.visibleEnd - 1,
    views: {
      activities: viewport.view,
      decisions: createDecisionView({
        sorted,
        statusById,
        selected,
        currentActivity,
        phase,
        lastFinish,
        previousFinish
      })
    },
    narration,
    prompt
  };
}

function createActivityViewport({
  sorted,
  statusById,
  selected,
  currentSortedIndex,
  phase,
  lastFinish,
  previousFinish
}) {
  const selectedIds = new Set(selected.map(({ id }) => id));
  const focusRow = currentSortedIndex ?? (
    phase === "complete" && selected.length > 0
      ? sorted.findIndex(({ id }) => id === selected.at(-1).id)
      : 0
  );
  const maximumStart = Math.max(0, sorted.length - maximumGridRows);
  const visibleStart = Math.min(maximumStart, Math.max(0, focusRow - maximumGridRows + 1));
  const visibleActivities = sorted.slice(visibleStart, visibleStart + maximumGridRows);
  const visibleEnd = visibleStart + visibleActivities.length - 1;
  const translateRow = (row) => row - visibleStart;
  const currentVisible = currentSortedIndex !== null
    && currentSortedIndex >= visibleStart
    && currentSortedIndex <= visibleEnd;

  const markers = [];
  if (phase === "complete") {
    sorted.forEach((activity, row) => {
      if (selectedIds.has(activity.id) && row >= visibleStart && row <= visibleEnd) {
        markers.push({
          row: translateRow(row),
          column: 0,
          kind: "selected",
          label: "selected activity"
        });
      }
    });
  } else if (currentVisible) {
    markers.push({
      row: translateRow(currentSortedIndex),
      column: 0,
      kind: phase === "consider" ? "candidate" : statusById.get(sorted[currentSortedIndex].id),
      label: phase === "consider" ? "consider now" : `${phase} decision`
    });
  }

  const annotations = visibleActivities.map((activity, row) => ({
    row,
    column: 0,
    label: `${activity.id} | input ${activity.originalIndex + 1}`
  }));
  if (currentVisible) {
    const activity = sorted[currentSortedIndex];
    annotations.push({
      row: translateRow(currentSortedIndex),
      column: 1,
      label: decisionAnnotation(phase, activity, lastFinish, previousFinish)
    });
  }

  return {
    visibleStart,
    visibleEnd,
    view: {
      values: visibleActivities.map(({ start, end }) => [start, end]),
      activeCells: currentVisible
        ? rowCells(translateRow(currentSortedIndex))
        : [],
      changedCells: currentVisible && (phase === "accept" || phase === "reject")
        ? rowCells(translateRow(currentSortedIndex))
        : [],
      markers,
      annotations
    }
  };
}

function createDecisionView({
  sorted,
  statusById,
  selected,
  currentActivity,
  phase,
  lastFinish,
  previousFinish
}) {
  const selectedOrder = new Map(selected.map(({ id }, index) => [id, index + 1]));
  const annotations = selected.map(({ id }) => ({
    key: id,
    label: `selected #${selectedOrder.get(id)}`
  }));
  if (currentActivity !== null && !selectedOrder.has(currentActivity.id)) {
    annotations.push({
      key: currentActivity.id,
      label: phase === "reject"
        ? `starts before ${formatNumber(lastFinish)}`
        : phase === "consider"
          ? previousFinish === null && lastFinish === null
            ? "first candidate"
            : `compare with finish ${formatNumber(lastFinish)}`
          : "decision pending"
    });
  }
  return {
    entries: sorted.map((activity) => ({
      key: activity.id,
      value: `${formatNumber(activity.start)}:${formatNumber(activity.end)}`,
      state: statusById.get(activity.id)
    })),
    activeKeys: currentActivity === null ? [] : [currentActivity.id],
    annotations,
    resultKeys: selected.map(({ id }) => id)
  };
}

function decisionAnnotation(phase, activity, lastFinish, previousFinish) {
  if (phase === "accept") {
    return previousFinish === null
      ? `first finish ${formatNumber(activity.end)}`
      : `${formatNumber(activity.start)} >= ${formatNumber(previousFinish)}`;
  }
  if (phase === "reject") {
    return `${formatNumber(activity.start)} < ${formatNumber(lastFinish)}`;
  }
  return lastFinish === null
    ? "earliest finish"
    : `start ${formatNumber(activity.start)} vs finish ${formatNumber(lastFinish)}`;
}

function rowCells(row) {
  return [{ row, column: 0 }, { row, column: 1 }];
}

function cloneActivity(activity) {
  return activity === null ? null : { ...activity };
}

function formatActivity(activity) {
  return `[${formatNumber(activity.start)}, ${formatNumber(activity.end)})`;
}
