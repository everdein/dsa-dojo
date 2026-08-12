import { validateBitValue } from "./model.mjs";

export function bitwiseParity(value) {
  validateBitValue(value);
  const leastSignificantBit = value & 1;
  return {
    parity: leastSignificantBit === 0 ? "even" : "odd",
    leastSignificantBit
  };
}

export const parity = bitwiseParity;
