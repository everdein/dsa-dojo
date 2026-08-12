export const maximumMinStackOperations = 12;

const decimalNumberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function parseMinStackProgram(program) {
  if (typeof program !== "string" || program.trim() === "") {
    throw new Error("Enter at least one Min Stack operation.");
  }

  const tokens = program.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter one operation between each comma.");
  }

  const operations = tokens.map((token, index) => parseOperation(token, index));
  validateMinStackOperations(operations);
  return operations;
}

export function validateMinStackOperations(operations) {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("Min Stack requires at least one operation.");
  }
  if (operations.length > maximumMinStackOperations) {
    throw new Error(`Keep Min Stack to ${maximumMinStackOperations} operations or fewer.`);
  }

  let depth = 0;
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (!Object.hasOwn(operations, index) || !operation || typeof operation !== "object") {
      throw new Error(`Operation ${index + 1} is invalid.`);
    }

    if (operation.type === "push") {
      if (!Number.isFinite(operation.value)) {
        throw new Error(`Push operation ${index + 1} requires a finite number.`);
      }
      depth += 1;
      continue;
    }

    if (operation.type !== "pop" && operation.type !== "min") {
      throw new Error(`Operation ${index + 1} must be push, pop, or min.`);
    }
    if (depth === 0) {
      throw new Error(`Operation ${index + 1} cannot ${operation.type} an empty stack.`);
    }
    if (operation.type === "pop") depth -= 1;
  }

  return operations;
}

/**
 * Each stack entry stores the minimum at its depth. Observable min and pop
 * operations return deterministic records with their zero-based program index.
 */
export function runMinStack(operations) {
  validateMinStackOperations(operations);

  const stack = [];
  const outputs = [];
  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];
    if (operation.type === "push") {
      const previousMinimum = stack.at(-1)?.minimum;
      stack.push({
        value: operation.value,
        minimum: previousMinimum === undefined
          ? operation.value
          : Math.min(previousMinimum, operation.value)
      });
      continue;
    }

    if (operation.type === "min") {
      outputs.push({
        operationIndex,
        type: "min",
        value: stack.at(-1).minimum
      });
      continue;
    }

    outputs.push({
      operationIndex,
      type: "pop",
      value: stack.pop().value
    });
  }

  return outputs;
}

export function formatMinStackProgram(operations) {
  validateMinStackOperations(operations);
  return operations.map((operation) => (
    operation.type === "push"
      ? `push ${formatFiniteNumber(operation.value)}`
      : operation.type
  )).join(", ");
}

function parseOperation(token, index) {
  const simpleType = token.toLowerCase();
  if (simpleType === "pop" || simpleType === "min") {
    return { type: simpleType };
  }

  const pushMatch = token.match(/^push\s+(.+)$/i);
  if (!pushMatch || !decimalNumberPattern.test(pushMatch[1].trim())) {
    throw new Error(`Operation ${index + 1} must be push <number>, pop, or min.`);
  }
  const value = Number(pushMatch[1]);
  if (!Number.isFinite(value)) {
    throw new Error(`Push operation ${index + 1} requires a finite number.`);
  }
  return { type: "push", value };
}

function formatFiniteNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Only finite numbers can be formatted.");
  return Object.is(value, -0) ? "-0" : String(value);
}
