import {
  formatUnionFindProgram,
  maximumUnionFindOperations,
  parseUnionFindProgram,
  UnionFind,
  validateUnionFindInput,
  validateUnionFindNodes
} from "./union-find.mjs";

export const maximumConnectivityOperations = maximumUnionFindOperations;

export function parseConnectivityProgram(source, nodes) {
  validateUnionFindNodes(nodes);
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one connectivity operation.");
  }
  const tokens = source.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter one connectivity operation between each comma.");
  }
  if (tokens.length > maximumConnectivityOperations) {
    throw new Error(`Keep connectivity queries to ${maximumConnectivityOperations} operations or fewer.`);
  }

  const operations = tokens.map((token, operationIndex) => {
    if (/^union\b/i.test(token)) {
      return parseUnionFindProgram(token, nodes)[0];
    }
    const connectedMatch = /^connected\s+(\S+)\s+(\S+)$/i.exec(token);
    if (connectedMatch) {
      return {
        type: "connected",
        left: connectedMatch[1],
        right: connectedMatch[2]
      };
    }
    throw new Error(`Operation ${operationIndex + 1} must be union A B or connected A B.`);
  });
  validateConnectivityInput(nodes, operations);
  return operations;
}

export function formatConnectivityProgram(operations, nodes) {
  validateConnectivityInput(nodes, operations);
  return operations.map((operation) => (
    operation.type === "union"
      ? formatUnionFindProgram([operation], nodes)
      : `connected ${operation.left} ${operation.right}`
  )).join(", ");
}

export function validateConnectivityInput(nodes, operations) {
  validateUnionFindNodes(nodes);
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("Connectivity Queries requires at least one operation.");
  }
  if (operations.length > maximumConnectivityOperations) {
    throw new Error(`Keep Connectivity Queries to ${maximumConnectivityOperations} operations or fewer.`);
  }

  const labels = new Set(nodes);
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (!Object.hasOwn(operations, index) || !operation || typeof operation !== "object") {
      throw new Error(`Operation ${index + 1} is invalid.`);
    }
    if (operation.type === "union") {
      validateUnionFindInput(nodes, [operation]);
      continue;
    }
    if (
      operation.type !== "connected"
      || !labels.has(operation.left)
      || !labels.has(operation.right)
    ) {
      throw new Error(`Connected operation ${index + 1} must reference two declared nodes.`);
    }
  }
  return { nodes, operations };
}

/**
 * Runs weighted unions and connectivity queries without mutating the program.
 * Every connected operation finds both roots with path compression and emits
 * one explicit answer; the final snapshot exposes the resulting parent forest.
 */
export function runConnectivityQueries(nodes, operations) {
  validateConnectivityInput(nodes, operations);
  const unionFind = new UnionFind(nodes);
  const answers = [];

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    if (operation.type === "union") {
      unionFind.unionWithDetails(operation.left, operation.right);
      continue;
    }

    const leftRoot = unionFind.findWithDetails(operation.left).root;
    const rightRoot = unionFind.findWithDetails(operation.right).root;
    answers.push({
      operationIndex,
      left: operation.left,
      right: operation.right,
      connected: leftRoot === rightRoot
    });
  }

  return {
    answers,
    final: unionFind.snapshot()
  };
}

export const connectivityQueries = runConnectivityQueries;
