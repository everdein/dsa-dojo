export const shareStateParameter = "share";
export const shareStateVersion = 1;
const maximumShareTokenLength = 6_000;
const maximumFieldCount = 8;
const maximumFieldLength = 600;

export function createLessonShareState({ lessonId, fields, stepIndex }) {
  return validateShareState({ v: shareStateVersion, kind: "lesson", lessonId, fields, stepIndex });
}

export function createComparisonShareState({ familyId, leftLessonId, rightLessonId, fields, leftIndex, rightIndex }) {
  return validateShareState({
    v: shareStateVersion,
    kind: "comparison",
    familyId,
    leftLessonId,
    rightLessonId,
    fields,
    leftIndex,
    rightIndex
  });
}

export function encodeShareState(state) {
  const validated = validateShareState(state);
  const bytes = new TextEncoder().encode(JSON.stringify(validated));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export function decodeShareState(token) {
  if (typeof token !== "string" || token.length === 0 || token.length > maximumShareTokenLength) {
    throw new Error("This shared state is missing or too large.");
  }
  if (!/^[A-Za-z0-9_-]+$/u.test(token)) throw new Error("This shared state has an invalid format.");
  try {
    const base64 = token.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(token.length / 4) * 4, "=");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return validateShareState(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This shared state")) throw error;
    throw new Error("This shared state could not be read.");
  }
}

export function shareStateUrl(baseUrl, state) {
  const url = baseUrl instanceof URL ? new URL(baseUrl.href) : new URL(String(baseUrl), "https://dsa-dojo.local/");
  url.searchParams.set(shareStateParameter, encodeShareState(state));
  if (state.kind === "lesson") url.hash = `lesson=${encodeURIComponent(state.lessonId)}`;
  else url.hash = "comparison";
  return url;
}

export function readShareStateFromUrl(url) {
  const parsed = url instanceof URL ? url : new URL(String(url), "https://dsa-dojo.local/");
  const token = parsed.searchParams.get(shareStateParameter);
  if (token === null) return { state: null, error: null };
  try {
    return { state: decodeShareState(token), error: null };
  } catch (error) {
    return { state: null, error: error.message };
  }
}

export function removeShareStateFromUrl(url) {
  const parsed = url instanceof URL ? new URL(url.href) : new URL(String(url), "https://dsa-dojo.local/");
  parsed.searchParams.delete(shareStateParameter);
  return parsed;
}

function validateShareState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("This shared state is not an object.");
  if (state.v !== shareStateVersion) throw new Error("This shared state uses an unsupported version.");
  const fields = validateFields(state.fields);
  if (state.kind === "lesson") {
    return Object.freeze({
      v: shareStateVersion,
      kind: "lesson",
      lessonId: validateId(state.lessonId, "lesson"),
      fields,
      stepIndex: validateIndex(state.stepIndex, "step")
    });
  }
  if (state.kind === "comparison") {
    const leftLessonId = validateId(state.leftLessonId, "left lesson");
    const rightLessonId = validateId(state.rightLessonId, "right lesson");
    if (leftLessonId === rightLessonId) throw new Error("This shared comparison repeats one algorithm.");
    return Object.freeze({
      v: shareStateVersion,
      kind: "comparison",
      familyId: validateId(state.familyId, "comparison family"),
      leftLessonId,
      rightLessonId,
      fields,
      leftIndex: validateIndex(state.leftIndex, "left step"),
      rightIndex: validateIndex(state.rightIndex, "right step")
    });
  }
  throw new Error("This shared state has an unknown kind.");
}

function validateFields(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw new Error("This shared state has invalid input fields.");
  const entries = Object.entries(fields);
  if (entries.length < 1 || entries.length > maximumFieldCount) throw new Error("This shared state has invalid input fields.");
  const normalized = {};
  for (const [key, value] of entries) {
    if (!/^[a-z][a-z0-9-]*$/u.test(key) || typeof value !== "string" || value.length > maximumFieldLength) {
      throw new Error("This shared state has invalid input fields.");
    }
    normalized[key] = value;
  }
  return Object.freeze(normalized);
}

function validateId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/u.test(value) || value.length > 100) {
    throw new Error(`This shared state has an invalid ${label}.`);
  }
  return value;
}

function validateIndex(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`This shared state has an invalid ${label}.`);
  }
  return value;
}
