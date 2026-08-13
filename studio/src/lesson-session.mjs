import { buildValidatedTrace } from "./lesson-contract.mjs";
import { recordLearningSession, writeLearningProgress } from "./learning-progress.mjs";
import { createPlayerState, playerReducer } from "./player.mjs";

export function restoreLessonPlayer(lesson, progress, buildTrace = buildValidatedTrace) {
  const restored = restoreLessonState(lesson, progress, buildTrace);
  let player = createPlayerState({
    lessonId: lesson.id,
    trace: restored.trace,
    input: restored.input
  });
  if (restored.stepIndex > 0) {
    player = playerReducer(player, { type: "STEP", index: restored.stepIndex });
  }
  return player;
}

export function restoreSharedLessonPlayer(lesson, state, progress, buildTrace = buildValidatedTrace) {
  try {
    if (state.lessonId !== lesson.id) throw new Error("The shared lesson does not match the link.");
    const input = lesson.input.parse(state.fields);
    const trace = buildTrace(lesson, input);
    if (state.stepIndex >= trace.length) throw new Error("The shared step is outside this lesson trace.");
    let player = createPlayerState({ lessonId: lesson.id, trace, input });
    if (state.stepIndex > 0) player = playerReducer(player, { type: "STEP", index: state.stepIndex });
    return { player, error: null };
  } catch (error) {
    return { player: restoreLessonPlayer(lesson, progress, buildTrace), error: error.message };
  }
}

export function restoreLessonState(lesson, progress, buildTrace = buildValidatedTrace) {
  const session = progress.lessons[lesson.id];
  const savedInput = session?.input === null || session?.input === undefined
    ? structuredClone(lesson.input.defaultValue)
    : structuredClone(session.input);
  try {
    const trace = buildTrace(lesson, savedInput);
    return {
      input: savedInput,
      trace,
      stepIndex: Math.max(0, Math.min(session?.stepIndex ?? 0, trace.length - 1))
    };
  } catch {
    const input = structuredClone(lesson.input.defaultValue);
    return { input, trace: buildTrace(lesson, input), stepIndex: 0 };
  }
}

export function persistLessonSession({ progress, lesson, player, lessons, storage, now = new Date() }) {
  const next = recordLearningSession(progress, {
    lessonId: lesson.id,
    input: player.input,
    stepIndex: player.index,
    traceLength: player.trace.length,
    completed: player.status === "complete",
    updatedAt: now.toISOString()
  }, lessons);
  return writeLearningProgress(storage, next, lessons);
}
