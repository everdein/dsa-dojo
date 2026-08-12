import { validateBitValue } from "./model.mjs";

export function countSetBits(value) {
  validateBitValue(value);
  let working = value;
  let count = 0;
  while (working !== 0) {
    working &= working - 1;
    count += 1;
  }
  return count;
}

export const popcount = countSetBits;
