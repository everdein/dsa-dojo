import { maximumBitValue, validateBitValue } from "./model.mjs";

export const maximumSingleNumberValues = 11;

export function validateSingleNumberInput(values) {
  if (!Array.isArray(values) || values.length === 0 || values.length > maximumSingleNumberValues || values.length % 2 === 0) {
    throw new Error(`Single Number requires an odd-length array of 1-${maximumSingleNumberValues} byte values.`);
  }
  const counts = new Map();
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index)) throw new Error("Single Number requires a dense array.");
    validateBitValue(values[index], "Each value");
    counts.set(values[index], (counts.get(values[index]) ?? 0) + 1);
  }
  const singles = [...counts.values()].filter((count) => count === 1).length;
  if (singles !== 1 || [...counts.values()].some((count) => count !== 1 && count !== 2)) {
    throw new Error("Exactly one value must occur once and every other value exactly twice.");
  }
  return values;
}

export function singleNumber(values) {
  validateSingleNumberInput(values);
  return values.reduce((accumulator, value) => accumulator ^ value, 0);
}

export { maximumBitValue };
