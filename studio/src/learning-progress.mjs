export const learningProgressStorageKey = "dsa-dojo.learning-progress.v1";

export function createLearningProgress() {
  return { version: 1, lastLessonId: null, lessons: {} };
}

export function readLearningProgress(storage, curriculum) {
  try {
    const raw = storage?.getItem?.(learningProgressStorageKey);
    return sanitizeLearningProgress(raw ? JSON.parse(raw) : null, curriculum);
  } catch {
    return createLearningProgress();
  }
}

export function writeLearningProgress(storage, progress, curriculum) {
  const sanitized = sanitizeLearningProgress(progress, curriculum);
  try {
    storage?.setItem?.(learningProgressStorageKey, JSON.stringify(sanitized));
  } catch {
    // Progress is an enhancement. The lesson remains usable when storage is unavailable.
  }
  return sanitized;
}

export function clearLearningProgress(storage) {
  try {
    storage?.removeItem?.(learningProgressStorageKey);
  } catch {
    // Ignore unavailable or blocked browser storage.
  }
  return createLearningProgress();
}

export function sanitizeLearningProgress(progress, curriculum) {
  const lessons = normalizeCurriculum(curriculum);
  const allowedIds = new Set(lessons.map(({ id }) => id));
  const sanitized = createLearningProgress();
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) return sanitized;

  for (const lesson of lessons) {
    const session = progress.lessons?.[lesson.id];
    if (!session || typeof session !== "object" || Array.isArray(session)) continue;
    const traceLength = positiveInteger(session.traceLength, 1);
    sanitized.lessons[lesson.id] = {
      completed: session.completed === true,
      stepIndex: clampInteger(session.stepIndex, 0, traceLength - 1),
      traceLength,
      input: cloneJsonValue(session.input),
      updatedAt: validTimestamp(session.updatedAt)
    };
  }

  if (typeof progress.lastLessonId === "string" && allowedIds.has(progress.lastLessonId)) {
    sanitized.lastLessonId = progress.lastLessonId;
  }
  return sanitized;
}

export function recordLearningSession(progress, session, curriculum) {
  const next = sanitizeLearningProgress(progress, curriculum);
  const lessonIds = new Set(normalizeCurriculum(curriculum).map(({ id }) => id));
  if (!lessonIds.has(session?.lessonId)) return next;
  const traceLength = positiveInteger(session.traceLength, 1);
  const previous = next.lessons[session.lessonId];
  next.lastLessonId = session.lessonId;
  next.lessons[session.lessonId] = {
    completed: previous?.completed === true || session.completed === true,
    stepIndex: clampInteger(session.stepIndex, 0, traceLength - 1),
    traceLength,
    input: cloneJsonValue(session.input),
    updatedAt: validTimestamp(session.updatedAt ?? new Date().toISOString())
  };
  return next;
}

export function learningProgressSummary(progress, curriculum) {
  const lessons = normalizeCurriculum(curriculum);
  const sanitized = sanitizeLearningProgress(progress, lessons);
  const completedIds = new Set(
    Object.entries(sanitized.lessons)
      .filter(([, session]) => session.completed)
      .map(([id]) => id)
  );
  const completed = completedIds.size;
  const total = lessons.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    completedIds,
    lastLessonId: sanitized.lastLessonId
  };
}

export function lessonProgressState(progress, lessonId) {
  const session = progress?.lessons?.[lessonId];
  if (!session) return { status: "not-started", label: "Not started", session: null };
  if (session.completed) return { status: "complete", label: "Complete", session };
  if (session.stepIndex > 0) {
    return {
      status: "in-progress",
      label: `Step ${session.stepIndex} of ${Math.max(0, session.traceLength - 1)}`,
      session
    };
  }
  return { status: "visited", label: "Visited", session };
}

function normalizeCurriculum(curriculum) {
  if (!Array.isArray(curriculum)) throw new TypeError("Learning progress requires a curriculum array.");
  return curriculum.filter((lesson) => lesson && typeof lesson.id === "string" && lesson.id.length > 0);
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

function cloneJsonValue(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
