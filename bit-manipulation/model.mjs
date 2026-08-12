export const bitWidth = 8;
export const maximumBitValue = (2 ** bitWidth) - 1;

export function validateBitValue(value, label = "Bit value") {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximumBitValue) {
    throw new Error(`${label} must be a whole number from 0 to ${maximumBitValue}.`);
  }
  return value;
}

export function parseBitValue(raw, label = "Bit value") {
  if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).trim() === "") {
    throw new Error(`${label} must be a whole number from 0 to ${maximumBitValue}.`);
  }
  return validateBitValue(Number(raw), label);
}

export function toFixedBits(value) {
  validateBitValue(value);
  return Array.from({ length: bitWidth }, (_, index) => (value >>> (bitWidth - index - 1)) & 1);
}

export function bitPositionToIndex(position) {
  if (!Number.isSafeInteger(position) || position < 0 || position >= bitWidth) {
    throw new Error(`Bit position must be from 0 to ${bitWidth - 1}.`);
  }
  return bitWidth - position - 1;
}
