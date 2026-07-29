const DEFAULT_SPEED = 850;

/**
 * Framework-free lesson player state machine. Rendering and timers stay in the
 * browser adapter; this module owns every user-visible player transition.
 */
export function createPlayerState({
  lessonId,
  trace,
  input,
  speed = DEFAULT_SPEED,
  guideMinimized = false
}) {
  return {
    lessonId,
    trace,
    input,
    index: 0,
    status: trace.length > 1 ? "ready" : "complete",
    speed,
    guideMinimized,
    error: ""
  };
}

export function playerReducer(state, action) {
  const lastIndex = Math.max(0, state.trace.length - 1);

  switch (action.type) {
    case "LOAD_LESSON":
      return createPlayerState({
        lessonId: action.lessonId,
        trace: action.trace,
        input: action.input,
        speed: state.speed,
        guideMinimized: state.guideMinimized
      });
    case "LOAD_INPUT":
      return {
        ...state,
        trace: action.trace,
        input: action.input,
        index: 0,
        status: action.trace.length > 1 ? "ready" : "complete",
        error: ""
      };
    case "VALIDATION_ERROR":
      return { ...state, status: "error", error: action.message };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: "",
        status: state.index === lastIndex ? "complete" : state.index === 0 ? "ready" : "paused"
      };
    case "SET_SPEED":
      return {
        ...state,
        speed: clamp(Number.isFinite(action.speed) ? action.speed : state.speed, 250, 2000)
      };
    case "STEP": {
      const index = clamp(action.index, 0, lastIndex);
      return {
        ...state,
        index,
        status: index === lastIndex ? "complete" : index === 0 ? "ready" : "paused",
        error: ""
      };
    }
    case "NEXT": {
      const index = clamp(state.index + 1, 0, lastIndex);
      return { ...state, index, status: index === lastIndex ? "complete" : "paused", error: "" };
    }
    case "PREVIOUS": {
      const index = clamp(state.index - 1, 0, lastIndex);
      return { ...state, index, status: index === 0 ? "ready" : "paused", error: "" };
    }
    case "PLAY":
      return {
        ...state,
        index: state.index >= lastIndex ? 0 : state.index,
        status: lastIndex === 0 ? "complete" : "playing",
        error: ""
      };
    case "TICK": {
      if (state.status !== "playing") return state;
      const index = clamp(state.index + 1, 0, lastIndex);
      return { ...state, index, status: index === lastIndex ? "complete" : "playing" };
    }
    case "PAUSE":
      return {
        ...state,
        status: state.index >= lastIndex ? "complete" : state.index === 0 ? "ready" : "paused"
      };
    case "RESET":
      return {
        ...state,
        index: 0,
        status: lastIndex === 0 ? "complete" : "ready",
        error: ""
      };
    case "TOGGLE_GUIDE":
      return { ...state, guideMinimized: !state.guideMinimized };
    default:
      return state;
  }
}

function clamp(value, minimum, maximum) {
  const normalized = Number.isFinite(value) ? value : minimum;
  return Math.max(minimum, Math.min(normalized, maximum));
}
