export const challengeModeStorageKey = "dsa-dojo.challenge-mode.v1";

const fallbackOutcomes = [
  "The algorithm pauses without inspecting or changing any state.",
  "The run restarts from the original input.",
  "The algorithm returns the current result immediately."
];

export function createChallengePreferences() {
  return { version: 1, enabled: false, bestByLesson: {} };
}

export function readChallengePreferences(storage, curriculum) {
  try {
    const raw = storage?.getItem?.(challengeModeStorageKey);
    return sanitizeChallengePreferences(raw ? JSON.parse(raw) : null, curriculum);
  } catch {
    return createChallengePreferences();
  }
}

export function writeChallengePreferences(storage, preferences, curriculum) {
  const sanitized = sanitizeChallengePreferences(preferences, curriculum);
  try {
    storage?.setItem?.(challengeModeStorageKey, JSON.stringify(sanitized));
  } catch {
    // Challenge Mode remains usable for the current session when storage is blocked.
  }
  return sanitized;
}

export function sanitizeChallengePreferences(preferences, curriculum) {
  const allowedIds = new Set(normalizeCurriculum(curriculum).map(({ id }) => id));
  const sanitized = createChallengePreferences();
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) return sanitized;
  sanitized.enabled = preferences.enabled === true;

  for (const [lessonId, result] of Object.entries(preferences.bestByLesson ?? {})) {
    if (!allowedIds.has(lessonId) || !result || typeof result !== "object" || Array.isArray(result)) continue;
    const total = positiveInteger(result.total, 1);
    const answered = clampInteger(result.answered, 0, total);
    const correct = clampInteger(result.correct, 0, answered);
    const skipped = clampInteger(result.skipped, 0, total - answered);
    sanitized.bestByLesson[lessonId] = {
      correct,
      answered,
      skipped,
      total,
      bestStreak: clampInteger(result.bestStreak, 0, correct),
      completedAt: validTimestamp(result.completedAt)
    };
  }
  return sanitized;
}

export function setChallengePreference(preferences, enabled, curriculum) {
  const next = sanitizeChallengePreferences(preferences, curriculum);
  next.enabled = enabled === true;
  return next;
}

export function recordChallengeBest(preferences, lessonId, summary, curriculum) {
  const next = sanitizeChallengePreferences(preferences, curriculum);
  if (!normalizeCurriculum(curriculum).some(({ id }) => id === lessonId)) return next;
  const candidate = sanitizeResult(summary);
  const previous = next.bestByLesson[lessonId];
  if (!previous || challengeResultScore(candidate) > challengeResultScore(previous)) {
    next.bestByLesson[lessonId] = candidate;
  }
  return next;
}

export function createChallengeSession(lessonId, trace) {
  assertTrace(trace);
  return {
    lessonId,
    traceLength: trace.length,
    answers: {},
    correct: 0,
    answered: 0,
    skipped: 0,
    streak: 0,
    bestStreak: 0
  };
}

export function buildChallengeQuestion(lessonId, trace, currentIndex) {
  assertTrace(trace);
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= trace.length - 1) return null;
  const targetIndex = currentIndex + 1;
  const answerText = normalizeText(trace[targetIndex].narration);
  const candidateTexts = [];

  for (let distance = 0; distance < trace.length; distance += 1) {
    for (const index of [currentIndex - distance, targetIndex + distance + 1]) {
      if (index < 0 || index >= trace.length || index === targetIndex) continue;
      const text = normalizeText(trace[index].narration);
      if (text !== answerText && !candidateTexts.includes(text)) candidateTexts.push(text);
    }
  }
  for (const text of fallbackOutcomes) {
    if (text !== answerText && !candidateTexts.includes(text)) candidateTexts.push(text);
  }

  const rawOptions = [
    { text: answerText, correct: true },
    ...candidateTexts.slice(0, 2).map((text) => ({ text, correct: false }))
  ];
  const rotation = stableHash(`${lessonId}:${currentIndex}`) % rawOptions.length;
  const options = [...rawOptions.slice(rotation), ...rawOptions.slice(0, rotation)].map((option, index) => ({
    id: `challenge-${targetIndex}-${index + 1}`,
    text: option.text
  }));
  const correctIndex = [...rawOptions.slice(rotation), ...rawOptions.slice(0, rotation)]
    .findIndex(({ correct }) => correct);

  return {
    id: `${lessonId}:${targetIndex}`,
    currentIndex,
    targetIndex,
    number: targetIndex,
    total: trace.length - 1,
    prompt: normalizeText(trace[currentIndex].prompt) || "What happens next?",
    options,
    correctOptionId: options[correctIndex].id,
    answerText
  };
}

export function answerChallenge(session, question, optionId) {
  assertSessionQuestion(session, question);
  if (session.answers[question.targetIndex]) return cloneSession(session);
  if (!question.options.some(({ id }) => id === optionId)) {
    throw new RangeError("Choose one of the available challenge outcomes.");
  }
  const correct = optionId === question.correctOptionId;
  const streak = correct ? session.streak + 1 : 0;
  return {
    ...cloneSession(session),
    answers: {
      ...session.answers,
      [question.targetIndex]: { optionId, correct, skipped: false }
    },
    correct: session.correct + (correct ? 1 : 0),
    answered: session.answered + 1,
    streak,
    bestStreak: Math.max(session.bestStreak, streak)
  };
}

export function skipChallenge(session, question) {
  assertSessionQuestion(session, question);
  if (session.answers[question.targetIndex]) return cloneSession(session);
  return {
    ...cloneSession(session),
    answers: {
      ...session.answers,
      [question.targetIndex]: { optionId: null, correct: false, skipped: true }
    },
    skipped: session.skipped + 1,
    streak: 0
  };
}

export function challengeSummary(session) {
  const total = Math.max(0, session.traceLength - 1);
  const accuracy = session.answered === 0 ? 0 : Math.round((session.correct / session.answered) * 100);
  return {
    correct: session.correct,
    answered: session.answered,
    skipped: session.skipped,
    total,
    bestStreak: session.bestStreak,
    accuracy,
    complete: session.answered + session.skipped === total
  };
}

function sanitizeResult(result) {
  const total = positiveInteger(result?.total, 1);
  const answered = clampInteger(result?.answered, 0, total);
  const correct = clampInteger(result?.correct, 0, answered);
  return {
    correct,
    answered,
    skipped: clampInteger(result?.skipped, 0, total - answered),
    total,
    bestStreak: clampInteger(result?.bestStreak, 0, correct),
    completedAt: validTimestamp(result?.completedAt ?? new Date().toISOString())
  };
}

function challengeResultScore(result) {
  const completionAccuracy = result.total === 0 ? 0 : result.correct / result.total;
  return (completionAccuracy * 1_000_000) + (result.correct * 1_000) + result.bestStreak;
}

function assertTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) throw new TypeError("Challenge Mode requires a non-empty trace.");
  for (const step of trace) {
    if (!step || typeof step.narration !== "string") throw new TypeError("Every challenge step needs narration.");
  }
}

function assertSessionQuestion(session, question) {
  if (!session || !question || question.id !== `${session.lessonId}:${question.targetIndex}`) {
    throw new TypeError("Challenge question does not belong to this session.");
  }
  if (session.traceLength - 1 !== question.total) throw new TypeError("Challenge trace changed during the session.");
}

function cloneSession(session) {
  return { ...session, answers: { ...session.answers } };
}

function normalizeCurriculum(curriculum) {
  if (!Array.isArray(curriculum)) throw new TypeError("Challenge preferences require a curriculum array.");
  return curriculum.filter((lesson) => lesson && typeof lesson.id === "string" && lesson.id.length > 0);
}

function normalizeText(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function clampInteger(value, minimum, maximum) {
  const integer = Number.isInteger(value) ? value : minimum;
  return Math.max(minimum, Math.min(integer, maximum));
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}
