export const maximumPermutationValues = 3;

export function parsePermutationValues(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("Enter at least one permutation value.");
  }
  const tokens = source.split(",").map((token) => token.trim());
  if (tokens.some((token) => token === "")) {
    throw new Error("Enter one finite number between each comma.");
  }
  const values = tokens.map(Number);
  return validatePermutationValues(values);
}

export function formatPermutationValues(values) {
  validatePermutationValues(values);
  return values.map((value) => Object.is(value, -0) ? "-0" : String(value)).join(", ");
}

export function validatePermutationValues(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Generate Permutations requires at least one value.");
  }
  if (values.length > maximumPermutationValues) {
    throw new Error(`Keep Generate Permutations to ${maximumPermutationValues} values or fewer.`);
  }

  const seen = new Set();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!Object.hasOwn(values, index) || !Number.isFinite(value)) {
      throw new Error("Permutation values must be a dense list of finite numbers.");
    }
    if (seen.has(value)) {
      throw new Error("Permutation values must be distinct.");
    }
    seen.add(value);
  }
  return values;
}

/**
 * Generate permutations in input-order depth-first-search order. Each recorded
 * permutation is a fresh array and the caller's input never changes.
 */
export function generatePermutations(values) {
  validatePermutationValues(values);
  const used = Array(values.length).fill(false);
  const path = [];
  const permutations = [];

  function visit() {
    if (path.length === values.length) {
      permutations.push([...path]);
      return;
    }
    for (let index = 0; index < values.length; index += 1) {
      if (used[index]) continue;
      used[index] = true;
      path.push(values[index]);
      visit();
      path.pop();
      used[index] = false;
    }
  }

  visit();
  return permutations;
}

export const permutations = generatePermutations;
