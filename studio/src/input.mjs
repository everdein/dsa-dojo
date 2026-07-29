export function parseNumberList(raw, { maximumLength = 12 } = {}) {
  const text = String(raw).trim();
  if (!text) throw new Error("Enter at least one number.");
  const parts = text.split(",").map((part) => part.trim());
  if (parts.some((part) => part === "")) {
    throw new Error("Enter a number between each comma.");
  }

  const values = parts.map((part) => Number(part));
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Use only finite numbers separated by commas.");
  }
  if (values.length > maximumLength) {
    throw new Error(`Keep the lesson to ${maximumLength} values or fewer.`);
  }
  return values;
}

export function parsePositiveInteger(raw, label) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return value;
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}
