export const maximumQueueOperations = 12;

export function validateQueueOperations(operations) {
  if (!Array.isArray(operations) || operations.length === 0 || operations.length > maximumQueueOperations) {
    throw new Error(`Queue Operations requires 1-${maximumQueueOperations} operations.`);
  }
  let size = 0;
  for (let index = 0; index < operations.length; index += 1) {
    if (!Object.hasOwn(operations, index) || !operations[index] || typeof operations[index] !== "object") {
      throw new Error("Every queue operation must be an object.");
    }
    const operation = operations[index];
    if (operation.type === "enqueue") {
      if (!Number.isFinite(operation.value)) throw new Error("Enqueue requires a finite number.");
      size += 1;
      continue;
    }
    if (operation.type !== "dequeue" && operation.type !== "peek") {
      throw new Error(`Unknown queue operation: ${String(operation.type)}.`);
    }
    if (size === 0) throw new Error(`${operation.type} cannot run on an empty queue.`);
    if (operation.type === "dequeue") size -= 1;
  }
  return operations;
}

export function runQueueOperations(operations) {
  validateQueueOperations(operations);
  const storage = [];
  const outputs = [];
  let head = 0;
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (operation.type === "enqueue") {
      storage.push(operation.value);
    } else if (operation.type === "peek") {
      outputs.push({ operation: "peek", index, value: storage[head] });
    } else {
      outputs.push({ operation: "dequeue", index, value: storage[head] });
      head += 1;
    }
  }
  return outputs;
}
