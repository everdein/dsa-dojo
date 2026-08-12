export const maximumBinaryTreeNodes = 15;

export function binaryTreeNodeId(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= maximumBinaryTreeNodes) {
    throw new Error(
      `Binary tree node slots must be integers from 0 through ${maximumBinaryTreeNodes - 1}.`
    );
  }
  return `node-${slot}`;
}

export function validateLevelOrderTree(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new Error("A binary tree requires at least one level-order token; use null for an empty tree.");
  }
  if (slots.length > maximumBinaryTreeNodes) {
    throw new Error(`Keep the binary tree to ${maximumBinaryTreeNodes} level-order slots or fewer.`);
  }

  for (let slot = 0; slot < slots.length; slot += 1) {
    if (
      !Object.hasOwn(slots, slot)
      || (slots[slot] !== null && !Number.isFinite(slots[slot]))
    ) {
      throw new Error("Binary tree slots must be finite numbers or null.");
    }
    if (slot > 0 && slots[slot] !== null) {
      const parentSlot = Math.floor((slot - 1) / 2);
      if (slots[parentSlot] === null) {
        throw new Error(
          `Binary tree slot ${slot} is orphaned because parent slot ${parentSlot} is null.`
        );
      }
    }
  }
  return slots;
}

export function parseLevelOrderTree(raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    throw new Error("Enter level-order values separated by commas, or null for an empty tree.");
  }
  const tokens = text.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter a finite number or null between each comma.");
  }
  if (tokens.length > maximumBinaryTreeNodes) {
    throw new Error(`Keep the binary tree to ${maximumBinaryTreeNodes} level-order slots or fewer.`);
  }

  const slots = tokens.map((token) => {
    if (token.toLowerCase() === "null") return null;
    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new Error("Binary tree tokens must be finite numbers or null.");
    }
    return value;
  });
  validateLevelOrderTree(slots);
  return trimTrailingNullSlots(slots);
}

export function formatLevelOrderTree(slots) {
  validateLevelOrderTree(slots);
  return trimTrailingNullSlots(slots)
    .map((value) => value === null ? "null" : formatTreeNumber(value))
    .join(", ");
}

export function buildBinaryTree(slots) {
  validateLevelOrderTree(slots);
  const nodeBySlot = new Map();

  for (let slot = 0; slot < slots.length; slot += 1) {
    if (slots[slot] === null) continue;
    nodeBySlot.set(slot, {
      id: binaryTreeNodeId(slot),
      slot,
      value: slots[slot],
      left: null,
      right: null
    });
  }

  for (const [slot, node] of nodeBySlot) {
    node.left = nodeBySlot.get(slot * 2 + 1) ?? null;
    node.right = nodeBySlot.get(slot * 2 + 2) ?? null;
  }
  return nodeBySlot.get(0) ?? null;
}

export function levelOrderSlots(root) {
  if (root === null) return [null];

  const slots = [];
  const pending = [{ node: root, slot: 0 }];
  const visited = new Set();
  while (pending.length > 0) {
    const { node, slot } = pending.shift();
    if (
      !node
      || typeof node !== "object"
      || visited.has(node)
      || !Number.isFinite(node.value)
      || node.slot !== slot
      || node.id !== binaryTreeNodeId(slot)
    ) {
      throw new Error("Binary tree nodes must form one finite, acyclic, slot-stable tree.");
    }
    visited.add(node);
    slots[slot] = node.value;

    for (const [child, childSlot] of [
      [node.left, slot * 2 + 1],
      [node.right, slot * 2 + 2]
    ]) {
      if (child === null) continue;
      if (childSlot >= maximumBinaryTreeNodes) {
        throw new Error(`Keep the binary tree to ${maximumBinaryTreeNodes} level-order slots or fewer.`);
      }
      pending.push({ node: child, slot: childSlot });
    }
  }

  const lastSlot = slots.length - 1;
  for (let slot = 0; slot <= lastSlot; slot += 1) {
    if (!Object.hasOwn(slots, slot)) slots[slot] = null;
  }
  validateLevelOrderTree(slots);
  return trimTrailingNullSlots(slots);
}

export function listBinaryTreeNodes(root) {
  if (root === null) return [];
  levelOrderSlots(root);
  const nodes = [];
  const pending = [root];
  while (pending.length > 0) {
    const node = pending.shift();
    nodes.push(node);
    if (node.left !== null) pending.push(node.left);
    if (node.right !== null) pending.push(node.right);
  }
  return nodes;
}

function trimTrailingNullSlots(slots) {
  const trimmed = [...slots];
  while (trimmed.length > 1 && trimmed.at(-1) === null) trimmed.pop();
  return trimmed;
}

function formatTreeNumber(value) {
  return Object.is(value, -0) ? "-0" : String(value);
}
