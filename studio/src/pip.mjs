export const PIP_STATES = Object.freeze([
  "idle",
  "curious",
  "thinking",
  "encouraging",
  "guiding",
  "aha",
  "celebrating",
  "caution",
  "cool"
]);

export const PIP_EMOTION_LABELS = Object.freeze({
  idle: "Ready",
  curious: "Curious",
  thinking: "Thinking",
  encouraging: "You’ve got this",
  guiding: "Guiding",
  aha: "Aha!",
  celebrating: "Celebrating",
  caution: "Let’s check that",
  cool: "Pattern spotted"
});

const pipStates = new Set(PIP_STATES);

export function isPipEmotion(state) {
  return typeof state === "string" && pipStates.has(state);
}

export function normalizePipState(state) {
  return pipStates.has(state) ? state : "idle";
}

export function pipStateForPlayer(status) {
  switch (status) {
    case "ready":
      return "curious";
    case "paused":
      return "thinking";
    case "playing":
      return "guiding";
    case "complete":
      return "celebrating";
    case "error":
      return "caution";
    default:
      return "idle";
  }
}

export function pipEmotionForLearning({
  status,
  stepIndex = 0,
  predictionLocked = false,
  cue = null,
  hasError = false
}) {
  if (hasError || status === "error") return "caution";
  if (status === "complete") return "celebrating";

  const normalizedCue = normalizePipState(cue);
  if (cue && normalizedCue !== "idle") return normalizedCue;
  if (stepIndex === 0) return predictionLocked ? "thinking" : "curious";
  if (stepIndex === 1 && predictionLocked) return "encouraging";
  return pipStateForPlayer(status);
}

export function pipEmotionLabel(state) {
  return PIP_EMOTION_LABELS[normalizePipState(state)];
}

export function setPipState(element, state) {
  if (!element) return;
  element.dataset.state = normalizePipState(state);
}

export function mountPips(root = globalThis.document) {
  if (!root?.querySelectorAll) return [];

  return [...root.querySelectorAll("[data-pip]")].map((element) => {
    if (element.dataset.pipReady !== "true") {
      element.replaceChildren(createPipParts(element.ownerDocument));
      element.dataset.pipReady = "true";
      element.setAttribute("aria-hidden", "true");
    }
    element.dataset.visible = "true";
    setPipState(element, element.dataset.state);
    return element;
  });
}

export function observePipVisibility(root = globalThis.document) {
  if (!root?.querySelectorAll) return null;
  const elements = [...root.querySelectorAll("[data-pip]")];
  const Observer = root.defaultView?.IntersectionObserver ?? globalThis.IntersectionObserver;
  if (typeof Observer !== "function") {
    elements.forEach((element) => {
      element.dataset.visible = "true";
    });
    return null;
  }

  const observer = new Observer((entries) => {
    for (const entry of entries) {
      entry.target.dataset.visible = String(entry.isIntersecting);
    }
  }, { rootMargin: "120px 0px", threshold: 0 });

  elements.forEach((element) => {
    element.dataset.visible = "false";
    observer.observe(element);
  });
  return observer;
}

function createPipParts(document) {
  const fragment = document.createDocumentFragment();
  const body = document.createElement("span");
  body.className = "pip-body";

  const face = document.createElement("span");
  face.className = "pip-face";
  face.append(
    makePart(document, "pip-brow pip-brow--left"),
    makePart(document, "pip-brow pip-brow--right"),
    makePart(document, "pip-eye pip-eye--left"),
    makePart(document, "pip-eye pip-eye--right"),
    makePart(document, "pip-mouth"),
    makePart(document, "pip-glasses")
  );

  body.append(
    face,
    makePart(document, "pip-arm pip-arm--left"),
    makePart(document, "pip-arm pip-arm--right")
  );

  const orbit = makePart(document, "pip-orbit");
  orbit.append(makePart(document, "pip-orbit-dot"));

  fragment.append(
    body,
    orbit,
    makePart(document, "pip-emotion-mark"),
    makePart(document, "pip-spark pip-spark--one"),
    makePart(document, "pip-spark pip-spark--two"),
    makePart(document, "pip-spark pip-spark--three")
  );
  return fragment;
}

function makePart(document, className) {
  const element = document.createElement("span");
  element.className = className;
  return element;
}
