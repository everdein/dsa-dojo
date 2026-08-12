import {
  formatIntervalList,
  maximumMergeIntervals,
  parseIntervalList
} from "../patterns/intervals/merge-intervals.mjs";

export const maximumActivityIntervals = maximumMergeIntervals;

export function parseActivityList(source) {
  return validateActivityIntervals(parseIntervalList(source));
}

export function formatActivityList(intervals) {
  validateActivityIntervals(intervals);
  return formatIntervalList(intervals);
}

export function validateActivityIntervals(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    throw new Error("Activity Selection requires at least one interval.");
  }
  if (intervals.length > maximumActivityIntervals) {
    throw new Error(`Keep Activity Selection to ${maximumActivityIntervals} intervals or fewer.`);
  }
  for (let index = 0; index < intervals.length; index += 1) {
    const interval = intervals[index];
    if (
      !Object.hasOwn(intervals, index)
      || !interval
      || typeof interval !== "object"
      || Array.isArray(interval)
      || !Object.hasOwn(interval, "start")
      || !Object.hasOwn(interval, "end")
      || !Number.isFinite(interval.start)
      || !Number.isFinite(interval.end)
    ) {
      throw new Error(`Activity ${index + 1} requires finite start and end values.`);
    }
    if (interval.start >= interval.end) {
      throw new Error(`Activity ${index + 1} must start before it ends.`);
    }
  }
  return intervals;
}

export function activityId(originalIndex) {
  if (!Number.isInteger(originalIndex) || originalIndex < 0 || originalIndex >= maximumActivityIntervals) {
    throw new Error("Activity ids require bounded nonnegative input indices.");
  }
  return `activity-${originalIndex}`;
}

export function sortActivitiesByFinish(intervals) {
  validateActivityIntervals(intervals);
  return intervals
    .map(({ start, end }, originalIndex) => ({
      id: activityId(originalIndex),
      originalIndex,
      start,
      end
    }))
    .sort(compareActivities);
}

/**
 * Treats activities as [start, end) intervals, so one may begin exactly when
 * the previous selection finishes. Equal finishes break by earlier start and
 * then original input index so equal-finish activities retain stable identities.
 */
export function selectActivities(intervals) {
  const sorted = sortActivitiesByFinish(intervals);
  const selected = [];
  let lastFinish = null;

  for (const activity of sorted) {
    if (lastFinish === null || activity.start >= lastFinish) {
      selected.push({ ...activity });
      lastFinish = activity.end;
    }
  }
  return selected;
}

export const activitySelection = selectActivities;

function compareActivities(left, right) {
  if (left.end !== right.end) return left.end < right.end ? -1 : 1;
  if (left.start !== right.start) return left.start < right.start ? -1 : 1;
  return left.originalIndex - right.originalIndex;
}
