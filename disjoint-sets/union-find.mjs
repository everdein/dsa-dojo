import {
  maximumGraphModelNodes,
  validateGraphInput
} from "../graphs/model.mjs";

export const maximumUnionFindNodes = maximumGraphModelNodes;
export const maximumUnionFindOperations = 12;

export function parseUnionFindNodes(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one disjoint-set node.");
  }
  const nodes = source.split(",").map((node) => node.trim());
  if (nodes.some((node) => node === "")) {
    throw new Error("Enter one node label between each comma.");
  }
  validateUnionFindNodes(nodes);
  return nodes;
}

export function formatUnionFindNodes(nodes) {
  validateUnionFindNodes(nodes);
  return nodes.join(", ");
}

export function parseUnionFindProgram(source, nodes) {
  validateUnionFindNodes(nodes);
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one union-find operation.");
  }
  const tokens = source.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter one union-find operation between each comma.");
  }
  if (tokens.length > maximumUnionFindOperations) {
    throw new Error(`Keep union-find to ${maximumUnionFindOperations} operations or fewer.`);
  }

  const operations = tokens.map((token, operationIndex) => {
    const unionMatch = /^union\s+(\S+)\s+(\S+)$/i.exec(token);
    if (unionMatch) return { type: "union", left: unionMatch[1], right: unionMatch[2] };
    const findMatch = /^find\s+(\S+)$/i.exec(token);
    if (findMatch) return { type: "find", node: findMatch[1] };
    throw new Error(`Operation ${operationIndex + 1} must be union A B or find A.`);
  });
  validateUnionFindInput(nodes, operations);
  return operations;
}

export function formatUnionFindProgram(operations, nodes) {
  validateUnionFindInput(nodes, operations);
  return operations.map((operation) => (
    operation.type === "find"
      ? `find ${operation.node}`
      : `union ${operation.left} ${operation.right}`
  )).join(", ");
}

export function validateUnionFindNodes(nodes) {
  validateGraphInput(nodes, []);
  return nodes;
}

export function validateUnionFindInput(nodes, operations) {
  validateUnionFindNodes(nodes);
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("Union-Find Fundamentals requires at least one operation.");
  }
  if (operations.length > maximumUnionFindOperations) {
    throw new Error(`Keep Union-Find Fundamentals to ${maximumUnionFindOperations} operations or fewer.`);
  }

  const labels = new Set(nodes);
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (!Object.hasOwn(operations, index) || !operation || typeof operation !== "object") {
      throw new Error(`Operation ${index + 1} is invalid.`);
    }
    if (operation.type === "find") {
      if (!labels.has(operation.node)) {
        throw new Error(`Find operation ${index + 1} must reference a declared node.`);
      }
      continue;
    }
    if (
      operation.type !== "union"
      || !labels.has(operation.left)
      || !labels.has(operation.right)
    ) {
      throw new Error(`Union operation ${index + 1} must reference two declared nodes.`);
    }
  }
  return { nodes, operations };
}

export class UnionFind {
  constructor(nodes) {
    validateUnionFindNodes(nodes);
    this.nodes = [...nodes];
    this.parent = new Map(nodes.map((node) => [node, node]));
    this.size = new Map(nodes.map((node) => [node, 1]));
    this.components = nodes.length;
  }

  inspectFind(node) {
    this.assertNode(node);
    const path = [node];
    let current = node;
    while (this.parent.get(current) !== current) {
      current = this.parent.get(current);
      path.push(current);
    }
    return {
      node,
      root: current,
      path,
      compressed: path.slice(0, -1).filter((pathNode) => this.parent.get(pathNode) !== current)
    };
  }

  findWithDetails(node) {
    const details = this.inspectFind(node);
    for (const pathNode of details.path.slice(0, -1)) {
      this.parent.set(pathNode, details.root);
    }
    return {
      node: details.node,
      root: details.root,
      path: [...details.path],
      compressed: [...details.compressed]
    };
  }

  find(node) {
    return this.findWithDetails(node).root;
  }

  unionRoots(leftRoot, rightRoot) {
    this.assertRoot(leftRoot);
    this.assertRoot(rightRoot);
    if (leftRoot === rightRoot) {
      return {
        merged: false,
        root: leftRoot,
        attachedRoot: null,
        size: this.size.get(leftRoot),
        components: this.components
      };
    }

    let root = leftRoot;
    let attachedRoot = rightRoot;
    if (this.size.get(root) < this.size.get(attachedRoot)) {
      [root, attachedRoot] = [attachedRoot, root];
    }
    this.parent.set(attachedRoot, root);
    this.size.set(root, this.size.get(root) + this.size.get(attachedRoot));
    this.components -= 1;
    return {
      merged: true,
      root,
      attachedRoot,
      size: this.size.get(root),
      components: this.components
    };
  }

  unionWithDetails(left, right) {
    const leftFind = this.findWithDetails(left);
    const rightFind = this.findWithDetails(right);
    const link = this.unionRoots(leftFind.root, rightFind.root);
    return {
      left,
      right,
      leftRoot: leftFind.root,
      rightRoot: rightFind.root,
      leftPath: [...leftFind.path],
      rightPath: [...rightFind.path],
      compressed: uniqueInOrder([...leftFind.compressed, ...rightFind.compressed]),
      ...link
    };
  }

  union(left, right) {
    return this.unionWithDetails(left, right).merged;
  }

  snapshot() {
    return {
      parent: Object.fromEntries(this.nodes.map((node) => [node, this.parent.get(node)])),
      size: Object.fromEntries(this.nodes.map((node) => [node, this.size.get(node)])),
      components: this.components
    };
  }

  sizeOfRoot(root) {
    this.assertRoot(root);
    return this.size.get(root);
  }

  parentOf(node) {
    this.assertNode(node);
    return this.parent.get(node);
  }

  assertNode(node) {
    if (!this.parent.has(node)) throw new Error(`Unknown union-find node: ${String(node)}.`);
  }

  assertRoot(root) {
    this.assertNode(root);
    if (this.parent.get(root) !== root) {
      throw new Error(`Union root ${root} is not currently a root.`);
    }
  }
}

export function runUnionFindProgram(nodes, operations) {
  validateUnionFindInput(nodes, operations);
  const unionFind = new UnionFind(nodes);
  const observations = [];

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    if (operation.type === "find") {
      const details = unionFind.findWithDetails(operation.node);
      observations.push({
        operationIndex,
        type: "find",
        node: operation.node,
        root: details.root,
        path: [...details.path],
        compressed: [...details.compressed]
      });
      continue;
    }

    const details = unionFind.unionWithDetails(operation.left, operation.right);
    observations.push({
      operationIndex,
      type: "union",
      left: operation.left,
      right: operation.right,
      leftRoot: details.leftRoot,
      rightRoot: details.rightRoot,
      merged: details.merged,
      root: details.root,
      attachedRoot: details.attachedRoot,
      size: details.size,
      components: details.components,
      compressed: [...details.compressed]
    });
  }

  return {
    observations,
    final: unionFind.snapshot()
  };
}

export const runUnionFind = runUnionFindProgram;

function uniqueInOrder(values) {
  return [...new Set(values)];
}
