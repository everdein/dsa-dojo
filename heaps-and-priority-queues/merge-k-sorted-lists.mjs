import { createLinkedList } from "../linked-lists/model.mjs";

export const maximumKSortedLists = 5;
export const maximumKSortedListNodes = 12;

const decimalNumberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function parseKSortedLists(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one sorted list.");
  }
  const rawLists = source.split(";").map((list) => list.trim());
  if (rawLists.some((list) => list === "")) {
    throw new Error("Enter one non-empty sorted list between each semicolon.");
  }
  if (rawLists.length > maximumKSortedLists) {
    throw new Error(`Keep the merge to ${maximumKSortedLists} sorted lists or fewer.`);
  }

  const lists = rawLists.map((rawList, listIndex) => {
    const tokens = rawList.split(",").map((token) => token.trim());
    if (tokens.some((token) => token === "")) {
      throw new Error(`List ${listIndex + 1} requires a number between each comma.`);
    }
    return tokens.map((token, elementIndex) => {
      if (!decimalNumberPattern.test(token)) {
        throw new Error(`List ${listIndex + 1}, value ${elementIndex + 1} must be a finite number.`);
      }
      const value = Number(token);
      if (!Number.isFinite(value)) {
        throw new Error(`List ${listIndex + 1}, value ${elementIndex + 1} must be finite.`);
      }
      return value;
    });
  });
  return validateKSortedLists(lists);
}

export function formatKSortedLists(lists) {
  validateKSortedLists(lists);
  return lists
    .map((list) => list.map(formatFiniteNumber).join(", "))
    .join("; ");
}

export function validateKSortedLists(lists) {
  if (!Array.isArray(lists) || lists.length === 0 || lists.length > maximumKSortedLists) {
    throw new Error(`Merge K Sorted Lists requires 1-${maximumKSortedLists} lists.`);
  }

  let totalNodes = 0;
  for (let listIndex = 0; listIndex < lists.length; listIndex += 1) {
    const list = lists[listIndex];
    if (!Object.hasOwn(lists, listIndex) || !Array.isArray(list) || list.length === 0) {
      throw new Error(`List ${listIndex + 1} must be a non-empty array.`);
    }
    for (let elementIndex = 0; elementIndex < list.length; elementIndex += 1) {
      const value = list[elementIndex];
      if (!Object.hasOwn(list, elementIndex) || !Number.isFinite(value)) {
        throw new Error(`List ${listIndex + 1} must contain dense finite numbers.`);
      }
      if (elementIndex > 0 && value < list[elementIndex - 1]) {
        throw new Error(`List ${listIndex + 1} must be sorted in nondecreasing order.`);
      }
    }
    totalNodes += list.length;
  }
  if (totalNodes > maximumKSortedListNodes) {
    throw new Error(`Keep the merge to ${maximumKSortedListNodes} total nodes or fewer.`);
  }
  return lists;
}

/**
 * Merge immutable sorted inputs by storing only one linked-list node per source
 * in a min-heap. Equal values break ties by list index, then element index.
 */
export function mergeKSortedLists(lists) {
  validateKSortedLists(lists);
  const heads = lists.map((values) => createLinkedList(values));
  const frontier = [];
  for (let listIndex = 0; listIndex < heads.length; listIndex += 1) {
    pushFrontier(frontier, createFrontierEntry(heads[listIndex], listIndex, 0));
  }

  const merged = [];
  while (frontier.length > 0) {
    const entry = popFrontier(frontier);
    merged.push(entry.value);
    if (entry.node.next !== null) {
      pushFrontier(frontier, createFrontierEntry(
        entry.node.next,
        entry.listIndex,
        entry.elementIndex + 1
      ));
    }
  }
  return merged;
}

export function compareFrontierEntries(left, right) {
  if (left.value !== right.value) return left.value < right.value ? -1 : 1;
  if (left.listIndex !== right.listIndex) return left.listIndex - right.listIndex;
  return left.elementIndex - right.elementIndex;
}

export function pushFrontier(frontier, entry) {
  frontier.push(entry);
  let childIndex = frontier.length - 1;
  while (childIndex > 0) {
    const parentIndex = Math.floor((childIndex - 1) / 2);
    if (compareFrontierEntries(frontier[childIndex], frontier[parentIndex]) >= 0) break;
    [frontier[childIndex], frontier[parentIndex]] = [frontier[parentIndex], frontier[childIndex]];
    childIndex = parentIndex;
  }
  return frontier;
}

export function popFrontier(frontier) {
  if (!Array.isArray(frontier) || frontier.length === 0) {
    throw new Error("Cannot extract from an empty merge frontier.");
  }
  const minimum = frontier[0];
  const last = frontier.pop();
  if (frontier.length === 0) return minimum;
  frontier[0] = last;

  let parentIndex = 0;
  while (true) {
    const leftIndex = parentIndex * 2 + 1;
    if (leftIndex >= frontier.length) break;
    const rightIndex = leftIndex + 1;
    const smallerChildIndex = rightIndex < frontier.length
      && compareFrontierEntries(frontier[rightIndex], frontier[leftIndex]) < 0
      ? rightIndex
      : leftIndex;
    if (compareFrontierEntries(frontier[smallerChildIndex], frontier[parentIndex]) >= 0) break;
    [frontier[parentIndex], frontier[smallerChildIndex]] = [
      frontier[smallerChildIndex],
      frontier[parentIndex]
    ];
    parentIndex = smallerChildIndex;
  }
  return minimum;
}

export function createFrontierEntry(node, listIndex, elementIndex) {
  if (
    !node
    || !Number.isFinite(node.value)
    || !Number.isInteger(listIndex)
    || listIndex < 0
    || !Number.isInteger(elementIndex)
    || elementIndex < 0
  ) {
    throw new Error("A merge frontier entry requires a finite node and non-negative source indices.");
  }
  return {
    id: `item-${listIndex}-${elementIndex}`,
    node,
    value: node.value,
    listIndex,
    elementIndex
  };
}

function formatFiniteNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Only finite list values can be formatted.");
  return Object.is(value, -0) ? "-0" : String(value);
}
