export const maximumMergeIntervals = 10;

const decimalNumberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function parseIntervalList(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one closed interval.");
  }

  const intervalTokens = source.split(",").map((token) => token.trim());
  if (intervalTokens.some((token) => token === "")) {
    throw new Error("Enter one interval between each comma.");
  }
  if (intervalTokens.length > maximumMergeIntervals) {
    throw new Error(`Keep the lesson to ${maximumMergeIntervals} intervals or fewer.`);
  }

  const intervals = intervalTokens.map((token, index) => {
    const endpoints = token.split(":").map((endpoint) => endpoint.trim());
    if (
      endpoints.length !== 2
      || endpoints.some((endpoint) => !decimalNumberPattern.test(endpoint))
    ) {
      throw new Error(`Interval ${index + 1} must use start:end with finite numeric endpoints.`);
    }
    const [start, end] = endpoints.map(Number);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error(`Interval ${index + 1} requires finite endpoints.`);
    }
    return { start, end };
  });

  return validateIntervals(intervals);
}

export function formatIntervalList(intervals) {
  validateIntervals(intervals);
  return intervals.map(({ start, end }) => (
    `${formatFiniteNumber(start)}:${formatFiniteNumber(end)}`
  )).join(", ");
}

export function validateIntervals(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    throw new Error("Merge Intervals requires at least one interval.");
  }
  if (intervals.length > maximumMergeIntervals) {
    throw new Error(`Keep Merge Intervals to ${maximumMergeIntervals} intervals or fewer.`);
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
      throw new Error(`Interval ${index + 1} requires finite start and end values.`);
    }
    if (interval.start > interval.end) {
      throw new Error(`Interval ${index + 1} must start at or before it ends.`);
    }
  }
  return intervals;
}

export function sortIntervalsByStart(intervals) {
  validateIntervals(intervals);
  return intervals
    .map(({ start, end }) => ({ start, end }))
    .sort(compareIntervals);
}

/**
 * Closed intervals merge when they overlap or merely touch. The public result
 * and the sorted working list are copies, so caller-owned objects stay intact.
 */
export function mergeIntervals(intervals) {
  const sorted = sortIntervalsByStart(intervals);
  const merged = [];

  for (const interval of sorted) {
    const current = merged.at(-1);
    if (!current || interval.start > current.end) {
      merged.push({ ...interval });
      continue;
    }
    if (interval.end > current.end) current.end = interval.end;
  }

  return merged;
}

function compareIntervals(left, right) {
  if (left.start !== right.start) return left.start < right.start ? -1 : 1;
  if (left.end !== right.end) return left.end < right.end ? -1 : 1;
  return 0;
}

function formatFiniteNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Only finite interval endpoints can be formatted.");
  return Object.is(value, -0) ? "-0" : String(value);
}
