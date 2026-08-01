import { buildValidatedTrace } from "./lesson-contract.mjs";
import { projectArrayView } from "./array-renderer.mjs";
import { projectLinkedListView } from "./linked-list-renderer.mjs";
import { getLesson, listLessons } from "./lessons/index.mjs";
import { lessonHash, readLessonIdFromHash } from "./navigation.mjs";
import {
  mountPips,
  observePipVisibility,
  pipStateForPlayer,
  setPipState
} from "./pip.mjs";
import { createPlayerState, playerReducer } from "./player.mjs";
import {
  controlValueToPlaybackDelay,
  playbackDelayToControlValue,
  playbackSpeedLabel
} from "./speed.mjs";

const lessons = listLessons();
const lessonIds = lessons.map((item) => item.id);
const topicCount = new Set(lessons.map((item) => item.topic)).size;
const initialLessonIdFromHash = readLessonIdFromHash(window.location.hash, lessonIds);
const initialLessonId = initialLessonIdFromHash ?? lessons[0].id;
let lesson = getLesson(initialLessonId);
let player = createPlayerState({
  lessonId: lesson.id,
  trace: buildValidatedTrace(lesson, lesson.input.defaultValue),
  input: structuredClone(lesson.input.defaultValue)
});
let timerId = null;
let prediction = createPredictionState(lesson.id);

const elements = {
  headerStatus: document.querySelector("#header-status"),
  lessonList: document.querySelector("#lesson-list"),
  lessonSection: document.querySelector("#lesson"),
  lessonEyebrow: document.querySelector("#lesson-eyebrow"),
  lessonTitle: document.querySelector("#lesson-title"),
  lessonSummary: document.querySelector("#lesson-summary"),
  fields: document.querySelector("#lesson-fields"),
  apply: document.querySelector("#apply-button"),
  sample: document.querySelector("#sample-button"),
  help: document.querySelector("#input-help"),
  error: document.querySelector("#input-error"),
  inputTitle: document.querySelector("#input-title"),
  visualizationRoot: document.querySelector("#visualization-root"),
  legend: document.querySelector("#visualization-legend"),
  stats: document.querySelector("#stat-grid"),
  previous: document.querySelector("#previous-button"),
  next: document.querySelector("#next-button"),
  play: document.querySelector("#play-button"),
  reset: document.querySelector("#reset-button"),
  speed: document.querySelector("#speed-input"),
  speedLabel: document.querySelector("#speed-label"),
  mobileCodeLocation: document.querySelector("#mobile-code-location"),
  mobileCodeLine: document.querySelector("#mobile-code-line"),
  completion: document.querySelector("#lesson-complete"),
  completionTitle: document.querySelector("#lesson-complete-title"),
  completionSample: document.querySelector("#completion-sample-button"),
  replay: document.querySelector("#replay-button"),
  nextLesson: document.querySelector("#next-lesson-button"),
  pipCard: document.querySelector(".pip-card"),
  pipAvatar: document.querySelector(".pip-card .pip-avatar"),
  pipToggle: document.querySelector("#pip-toggle"),
  pipHeading: document.querySelector("#pip-heading"),
  pipMessage: document.querySelector("#pip-message"),
  pipPrompt: document.querySelector("#pip-prompt"),
  prediction: document.querySelector("#prediction-checkpoint"),
  predictionQuestion: document.querySelector("#prediction-question"),
  predictionForm: document.querySelector("#prediction-form"),
  predictionInput: document.querySelector("#prediction-input"),
  predictionError: document.querySelector("#prediction-error"),
  predictionResult: document.querySelector("#prediction-result"),
  predictionText: document.querySelector("#prediction-text"),
  predictionFeedback: document.querySelector("#prediction-feedback"),
  codeTitle: document.querySelector("#code-title"),
  fileLabel: document.querySelector("#file-label"),
  codeLines: document.querySelector("#code-lines"),
  complexityChip: document.querySelector("#complexity-chip"),
  timeComplexity: document.querySelector("#time-complexity"),
  spaceComplexity: document.querySelector("#space-complexity"),
  spaceComplexityLabel: document.querySelector("#space-complexity-label"),
  complexityExplanation: document.querySelector("#complexity-explanation"),
  reflectionEyebrow: document.querySelector("#reflection-eyebrow"),
  reflectionTitle: document.querySelector("#reflection-title"),
  reflectionBody: document.querySelector("#reflection-body"),
  live: document.querySelector("#live-region"),
  stepLabel: document.querySelector("#step-label"),
  stepCount: document.querySelector("#step-count")
};

function initializeCatalog() {
  elements.lessonList.replaceChildren(...lessons.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lesson-card";
    button.dataset.lessonId = item.id;
    button.setAttribute("aria-current", "false");

    const number = document.createElement("span");
    number.className = "lesson-card-number";
    number.textContent = String(item.order).padStart(2, "0");
    const copy = document.createElement("span");
    copy.className = "lesson-card-copy";
    const topic = document.createElement("small");
    topic.textContent = item.topic;
    const title = document.createElement("strong");
    title.textContent = item.catalogLabel;
    const description = document.createElement("span");
    description.textContent = item.catalogDescription;
    copy.append(topic, title, description);
    const arrow = document.createElement("span");
    arrow.className = "lesson-card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    button.append(number, copy, arrow);
    button.addEventListener("click", () => loadLesson(item.id));
    return button;
  }));
}

function renderCatalogState() {
  elements.lessonList.querySelectorAll(".lesson-card").forEach((button) => {
    button.setAttribute("aria-current", button.dataset.lessonId === lesson.id ? "true" : "false");
  });
}

function renderLessonChrome() {
  elements.headerStatus.textContent = `${topicCount} DATA STRUCTURES · ${lessons.length} LESSONS`;
  elements.lessonEyebrow.textContent = `${lesson.topic.toUpperCase()} / LESSON ${String(lesson.order).padStart(2, "0")}`;
  elements.lessonTitle.textContent = lesson.title;
  elements.lessonSummary.textContent = lesson.summary;
  elements.inputTitle.textContent = lesson.input.heading ?? (lesson.renderer === "array" ? "Your array" : "Your linked list");
  elements.help.textContent = lesson.input.help;
  elements.pipHeading.textContent = lesson.guide.heading;
  elements.codeTitle.textContent = lesson.code.title;
  elements.fileLabel.textContent = lesson.code.filename;
  elements.complexityChip.textContent = lesson.complexity.chip;
  elements.timeComplexity.textContent = lesson.complexity.time;
  elements.spaceComplexity.textContent = lesson.complexity.space;
  elements.spaceComplexityLabel.textContent = lesson.complexity.spaceLabel ?? "auxiliary space";
  elements.complexityExplanation.textContent = lesson.complexity.explanation;
  elements.reflectionEyebrow.textContent = lesson.reflection.eyebrow;
  elements.reflectionTitle.textContent = lesson.reflection.title;
  elements.reflectionBody.textContent = lesson.reflection.body;
  renderFields();
  renderLegend();
  renderCode();
}

function renderFields() {
  const serialized = lesson.input.serialize(player.input);
  elements.fields.replaceChildren(...lesson.input.fields.map((field) => {
    const wrapper = document.createElement("label");
    wrapper.className = "lesson-field";
    wrapper.htmlFor = `input-${field.id}`;
    const label = document.createElement("span");
    label.textContent = field.label;
    const input = document.createElement("input");
    input.id = `input-${field.id}`;
    input.dataset.fieldId = field.id;
    input.type = field.type;
    input.inputMode = field.inputMode;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-describedby", "input-help input-error");
    input.setAttribute("aria-invalid", "false");
    input.value = serialized[field.id] ?? "";
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.min !== undefined) input.min = String(field.min);
    if (field.max !== undefined) input.max = String(field.max);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") applyCurrentInput();
    });
    wrapper.append(label, input);
    return wrapper;
  }));
}

function renderLegend() {
  elements.legend.replaceChildren(...lesson.legend.map((item) => {
    const legendItem = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.className = `legend-swatch legend-swatch--${item.kind}`;
    legendItem.append(swatch, document.createTextNode(item.label));
    return legendItem;
  }));
}

function renderCode() {
  elements.codeLines.replaceChildren(...lesson.code.lines.map((line) => {
    const sourceLine = document.createElement("span");
    sourceLine.className = "code-line";
    sourceLine.dataset.codeSteps = line.steps.join(" ");
    sourceLine.dataset.lineNumber = String(line.number);
    const number = document.createElement("b");
    number.textContent = String(line.number);
    sourceLine.append(number, document.createTextNode(line.text));
    return sourceLine;
  }));
}

function render() {
  const step = player.trace[player.index];
  renderCatalogState();
  renderVisualization(step);
  renderStats(step);
  renderCodeState(step);
  renderPip(step);
  renderPrediction();
  renderCompletion();

  elements.error.textContent = player.error;
  elements.fields.querySelectorAll("[data-field-id]").forEach((input) => {
    input.setAttribute("aria-invalid", player.error ? "true" : "false");
  });
  elements.stepLabel.textContent = player.status.toUpperCase();
  elements.stepCount.textContent = `${player.index} / ${player.trace.length - 1}`;
  elements.previous.disabled = player.index === 0;
  elements.next.disabled = player.index === player.trace.length - 1;
  elements.next.textContent = player.index === 0 && prediction.locked
    ? "Reveal next step →"
    : "Next →";
  const playing = player.status === "playing";
  elements.play.innerHTML = playing ? "Ⅱ <span>Pause</span>" : "▶ <span>Play</span>";
  elements.play.setAttribute("aria-label", playing ? "Pause lesson" : "Play lesson");
  const speedText = playbackSpeedLabel(player.speed);
  elements.speed.value = String(playbackDelayToControlValue(player.speed));
  elements.speedLabel.textContent = speedText;
  elements.speed.setAttribute("aria-valuetext", `${speedText} speed`);
  elements.pipCard.classList.toggle("is-minimized", player.guideMinimized);
  elements.pipToggle.textContent = player.guideMinimized ? "+" : "−";
  elements.pipToggle.setAttribute("aria-label", player.guideMinimized ? "Expand Pip" : "Minimize Pip");
  elements.pipToggle.setAttribute("aria-expanded", String(!player.guideMinimized));
  elements.live.textContent = `${lesson.title}. Step ${player.index} of ${player.trace.length - 1}. ${step.narration}`;
}

function renderVisualization(step) {
  if (lesson.renderer === "array") {
    renderArray(step);
    return;
  }
  if (lesson.renderer === "linked-list") {
    renderLinkedList(step);
    return;
  }
  throw new Error(`Unsupported renderer: ${lesson.renderer}`);
}

function renderArray(step) {
  const cells = projectArrayView(step.view);
  const { values } = step.view;
  const scroll = document.createElement("div");
  scroll.className = "array-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("aria-label", "Scrollable array visualization");
  const cellList = document.createElement("div");
  cellList.className = "array-cells";
  cellList.setAttribute("role", "list");
  cellList.style.setProperty("--array-count", values.length);
  cellList.style.minWidth = `${Math.max(values.length * 66, 280)}px`;
  cellList.replaceChildren(...cells.map((model) => {
    const cell = document.createElement("div");
    cell.className = "array-cell";
    cell.dataset.index = String(model.index);
    cell.setAttribute("role", "listitem");

    if (model.active) {
      cell.classList.add("array-cell--active");
    }
    if (model.changed) {
      cell.classList.add("array-cell--changed");
    }
    for (const range of model.ranges) {
      cell.classList.add(`array-cell--range-${range.kind}`);
      if (range.isStart) cell.classList.add("array-cell--range-start");
      if (range.isEnd) cell.classList.add("array-cell--range-end");
    }
    if (model.markers.length > 0) {
      const markerList = document.createElement("span");
      markerList.className = "array-markers";
      markerList.setAttribute("aria-hidden", "true");
      for (const marker of model.markers) {
        cell.classList.add(`array-cell--marker-${marker.kind}`);
        const markerLabel = document.createElement("span");
        markerLabel.className = `array-marker array-marker--${marker.kind}`;
        markerLabel.textContent = marker.label;
        markerList.append(markerLabel);
      }
      cell.append(markerList);
    }
    if (model.annotations.length > 0) {
      const annotationList = document.createElement("span");
      annotationList.className = "array-annotations";
      annotationList.setAttribute("aria-hidden", "true");
      for (const annotation of model.annotations) {
        const note = document.createElement("span");
        note.className = "array-annotation";
        note.textContent = annotation.label;
        annotationList.append(note);
      }
      cell.append(annotationList);
    }
    const valueLabel = document.createElement("span");
    valueLabel.textContent = model.formattedValue;
    cell.append(valueLabel);
    cell.setAttribute("aria-label", model.ariaLabel);
    return cell;
  }));
  scroll.append(cellList);
  elements.visualizationRoot.replaceChildren(scroll);
  keepActiveItemsVisible(scroll, cellList.querySelectorAll(".array-cell--active"));
}

function renderLinkedList(step) {
  const model = projectLinkedListView(step.view);
  const scroll = document.createElement("div");
  scroll.className = "linked-list-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("aria-label", "Scrollable linked-list visualization");
  const canvas = document.createElement("div");
  canvas.className = "linked-list-canvas";
  canvas.style.minWidth = `${Math.max(model.nodes.length * 142 + 38, 320)}px`;
  canvas.setAttribute("role", "list");
  canvas.setAttribute("aria-label", model.ariaLabel);

  if (model.nodes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "linked-list-empty";
    empty.textContent = "Empty list · head → null";
    canvas.append(empty);
  }

  for (const link of model.links.filter((item) => !item.pointsToNull)) {
    const linkElement = document.createElement("span");
    linkElement.className = `linked-list-link linked-list-link--${link.direction}`;
    if (link.changed) linkElement.classList.add("linked-list-link--changed");
    linkElement.style.setProperty("--from-index", String(link.fromIndex));
    linkElement.style.setProperty("--to-index", String(link.toIndex));
    linkElement.setAttribute("aria-hidden", "true");
    canvas.append(linkElement);
  }

  for (const node of model.nodes) {
    const item = document.createElement("div");
    item.className = "linked-list-item";
    item.dataset.nodeId = node.id;
    item.style.setProperty("--node-index", String(node.index));
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", node.ariaLabel);
    if (node.active) item.classList.add("linked-list-item--active");
    if (node.changed) item.classList.add("linked-list-item--changed");
    node.states.forEach((state) => item.classList.add(`linked-list-item--state-${state.kind}`));

    if (node.pointers.length > 0) {
      const pointerList = document.createElement("span");
      pointerList.className = "linked-list-pointers";
      pointerList.setAttribute("aria-hidden", "true");
      for (const pointer of node.pointers) {
        const pointerLabel = document.createElement("span");
        pointerLabel.className = `linked-list-pointer linked-list-pointer--${pointer.kind}`;
        pointerLabel.textContent = pointer.label;
        pointerList.append(pointerLabel);
      }
      item.append(pointerList);
    }

    const nodeElement = document.createElement("div");
    nodeElement.className = "linked-list-node";
    nodeElement.dataset.index = String(node.index);
    const value = document.createElement("span");
    value.textContent = node.formattedValue;
    nodeElement.append(value);

    const nextLabel = document.createElement("span");
    nextLabel.className = "linked-list-next-label";
    nextLabel.textContent = node.pointsToNull ? "next: null" : `next: ${node.nextIndex}`;

    const annotations = document.createElement("span");
    annotations.className = "linked-list-annotations";
    annotations.setAttribute("aria-hidden", "true");
    for (const annotation of [...node.states, ...node.annotations]) {
      const annotationLabel = document.createElement("span");
      annotationLabel.className = "linked-list-annotation";
      annotationLabel.textContent = annotation.label;
      annotations.append(annotationLabel);
    }
    item.append(nodeElement, nextLabel, annotations);
    canvas.append(item);
  }

  scroll.append(canvas);
  const nullPointers = document.createElement("div");
  nullPointers.className = "linked-list-null-pointers";
  nullPointers.replaceChildren(...model.nullPointers.map((pointer) => {
    const label = document.createElement("span");
    label.className = "linked-list-null-pointer";
    label.textContent = `${pointer.label} → null`;
    label.setAttribute("aria-label", pointer.ariaLabel);
    return label;
  }));
  elements.visualizationRoot.replaceChildren(scroll, nullPointers);
  const activeItems = canvas.querySelectorAll(".linked-list-item--active");
  const fastItem = canvas.querySelector(".linked-list-pointer--fast")?.closest(".linked-list-item");
  keepActiveItemsVisible(scroll, activeItems, fastItem);
}

function keepActiveItemsVisible(scroll, activeItems, preferredItem = null) {
  const items = [...activeItems];
  if (items.length === 0) return;

  window.requestAnimationFrame(() => {
    if (items.some((item) => !item.isConnected)) return;
    const padding = 12;
    const visibleLeft = scroll.scrollLeft;
    const visibleRight = visibleLeft + scroll.clientWidth;
    const activeLeft = Math.min(...items.map((item) => item.offsetLeft));
    const activeRight = Math.max(...items.map((item) => item.offsetLeft + item.offsetWidth));
    const activeWidth = activeRight - activeLeft;
    const availableWidth = Math.max(0, scroll.clientWidth - (padding * 2));
    let nextScrollLeft = null;

    if (activeWidth <= availableWidth) {
      if (activeLeft < visibleLeft + padding) {
        nextScrollLeft = Math.max(0, activeLeft - padding);
      } else if (activeRight > visibleRight - padding) {
        nextScrollLeft = Math.max(0, activeRight - scroll.clientWidth + padding);
      }
    } else {
      const focus = preferredItem?.isConnected ? preferredItem : items.at(-1);
      const focusLeft = focus.offsetLeft;
      const focusRight = focusLeft + focus.offsetWidth;
      if (focusLeft < visibleLeft + padding) {
        nextScrollLeft = Math.max(0, focusLeft - padding);
      } else if (focusRight > visibleRight - padding) {
        nextScrollLeft = Math.max(0, focusRight - scroll.clientWidth + padding);
      }
    }

    if (nextScrollLeft !== null) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroll.scrollTo({
        left: nextScrollLeft,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }
  });
}

function renderStats(step) {
  elements.stats.style.setProperty("--stat-count", lesson.stats.length);
  elements.stats.replaceChildren(...lesson.stats.map((stat) => {
    const card = document.createElement("div");
    card.className = `stat-card${stat.accent ? " stat-card--accent" : ""}`;
    const label = document.createElement("span");
    label.textContent = stat.label;
    const value = document.createElement("strong");
    value.textContent = stat.value(step);
    card.append(label, value);
    if (stat.detail) {
      const detail = document.createElement("small");
      detail.textContent = stat.detail(step);
      card.append(detail);
    }
    return card;
  }));
}

function renderCodeState(step) {
  const activeLines = lesson.code.lines.filter((line) => (
    line.steps.some((codeStep) => step.codeSteps.includes(codeStep))
  ));
  const firstLine = activeLines[0];
  const lastLine = activeLines.at(-1);
  const representativeLine = activeLines.find((line) => line.text.trim()) ?? firstLine;

  document.querySelectorAll(".code-line").forEach((line) => {
    const steps = line.dataset.codeSteps.split(" ");
    const active = step.codeSteps.some((codeStep) => steps.includes(codeStep));
    line.classList.toggle("is-active", active);
    if (Number(line.dataset.lineNumber) === representativeLine.number) {
      line.setAttribute("aria-current", "step");
    } else {
      line.removeAttribute("aria-current");
    }
  });

  elements.mobileCodeLocation.textContent = firstLine === lastLine
    ? `L${firstLine.number}`
    : `L${firstLine.number}\u2013${lastLine.number}`;
  elements.mobileCodeLine.textContent = representativeLine.text.trim() || "Code block boundary";
}

function renderCompletion() {
  const complete = player.status === "complete";
  elements.completion.hidden = !complete;
  if (!complete) return;

  const nextLesson = getNextLesson();
  elements.completionTitle.textContent = `${lesson.catalogLabel} complete.`;
  elements.nextLesson.disabled = nextLesson === null;
  elements.nextLesson.textContent = nextLesson
    ? "Next lesson →"
    : "Next lesson";
  elements.nextLesson.setAttribute(
    "aria-label",
    nextLesson ? `Next lesson: ${nextLesson.title}` : "No next lesson. Curriculum complete."
  );
}

function getNextLesson() {
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  return lessons[currentIndex + 1] ?? null;
}

function renderPip(step) {
  setPipState(elements.pipAvatar, pipStateForPlayer(player.status));
  elements.pipMessage.textContent = step.narration;
  elements.pipPrompt.textContent = step.prompt;
}

function createPredictionState(lessonId) {
  return { lessonId, locked: false, text: "" };
}

function resetPrediction() {
  prediction = createPredictionState(lesson.id);
  elements.predictionInput.value = "";
}

function renderPrediction() {
  const available = player.index === 0 || prediction.locked;
  elements.prediction.hidden = !available;
  if (!available) return;

  elements.predictionQuestion.textContent = player.trace[0].prompt;
  elements.predictionForm.hidden = prediction.locked;
  elements.predictionResult.hidden = !prediction.locked;
  elements.predictionError.textContent = "";

  if (!prediction.locked) return;
  elements.predictionText.textContent = prediction.text;
  elements.predictionFeedback.textContent = player.index === 0
    ? "Locked in. Reveal the next step, then compare your reasoning with the visible state."
    : "Now compare your prediction with the state change and Pip’s explanation.";
}

function loadLesson(id, { enter = true } = {}) {
  if (id !== lesson.id) {
    stopTimer();
    lesson = getLesson(id);
    const input = structuredClone(lesson.input.defaultValue);
    const trace = buildValidatedTrace(lesson, input);
    player = playerReducer(player, { type: "LOAD_LESSON", lessonId: lesson.id, trace, input });
    resetPrediction();
    window.history.replaceState(null, "", lessonHash(lesson.id));
    renderLessonChrome();
    render();
  }
  if (enter) enterLesson();
}

function enterLesson() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.lessonSection.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start"
  });
  elements.lessonTitle.focus({ preventScroll: true });
}

function collectFields() {
  return Object.fromEntries(
    [...elements.fields.querySelectorAll("[data-field-id]")]
      .map((input) => [input.dataset.fieldId, input.value])
  );
}

function applyCurrentInput() {
  stopTimer();
  try {
    const input = lesson.input.parse(collectFields());
    const trace = buildValidatedTrace(lesson, input);
    player = playerReducer(player, { type: "LOAD_INPUT", trace, input });
    resetPrediction();
    renderFields();
  } catch (error) {
    player = playerReducer(player, { type: "VALIDATION_ERROR", message: error.message });
  }
  render();
}

function loadSample() {
  stopTimer();
  const input = structuredClone(lesson.input.sampleValue);
  const trace = buildValidatedTrace(lesson, input);
  player = playerReducer(player, { type: "LOAD_INPUT", trace, input });
  resetPrediction();
  renderFields();
  render();
}

function startPlayback() {
  player = playerReducer(player, { type: "PLAY" });
  restartTimer();
  render();
}

function pausePlayback() {
  stopTimer();
  player = playerReducer(player, { type: "PAUSE" });
  render();
}

function restartTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  if (player.status !== "playing") {
    timerId = null;
    return;
  }
  timerId = window.setInterval(() => {
    player = playerReducer(player, { type: "TICK" });
    if (player.status !== "playing") {
      window.clearInterval(timerId);
      timerId = null;
    }
    render();
  }, player.speed);
}

function stopTimer() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = null;
}

function move(action) {
  stopTimer();
  player = playerReducer(player, action);
  render();
}

elements.apply.addEventListener("click", applyCurrentInput);
elements.sample.addEventListener("click", loadSample);
elements.predictionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.predictionInput.value.trim();
  if (!text) {
    elements.predictionError.textContent = "Write a short prediction before locking it in.";
    elements.predictionInput.focus();
    return;
  }
  prediction = { lessonId: lesson.id, locked: true, text };
  render();
  elements.next.focus({ preventScroll: true });
});
elements.completionSample.addEventListener("click", () => {
  loadSample();
  elements.play.focus({ preventScroll: true });
});
elements.replay.addEventListener("click", () => {
  startPlayback();
  elements.play.focus({ preventScroll: true });
});
elements.nextLesson.addEventListener("click", () => {
  const nextLesson = getNextLesson();
  if (nextLesson) loadLesson(nextLesson.id);
});
elements.previous.addEventListener("click", () => move({ type: "PREVIOUS" }));
elements.next.addEventListener("click", () => move({ type: "NEXT" }));
elements.play.addEventListener("click", () => {
  if (player.status === "playing") pausePlayback();
  else startPlayback();
});
elements.reset.addEventListener("click", () => move({ type: "RESET" }));
elements.speed.addEventListener("input", () => {
  const wasPlaying = player.status === "playing";
  player = playerReducer(player, {
    type: "SET_SPEED",
    speed: controlValueToPlaybackDelay(Number(elements.speed.value))
  });
  if (wasPlaying) restartTimer();
  render();
});
elements.pipToggle.addEventListener("click", () => {
  player = playerReducer(player, { type: "TOGGLE_GUIDE" });
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.target.matches("input, button, textarea, select, a[href], [contenteditable='true']")) return;
  if (event.key === "ArrowRight") move({ type: "NEXT" });
  if (event.key === "ArrowLeft") move({ type: "PREVIOUS" });
  if (event.key === " ") {
    event.preventDefault();
    player.status === "playing" ? pausePlayback() : startPlayback();
  }
  if (event.key.toLowerCase() === "r") move({ type: "RESET" });
});

window.addEventListener("hashchange", () => {
  const id = readLessonIdFromHash(window.location.hash, lessonIds);
  if (id && id !== lesson.id) loadLesson(id);
});

mountPips();
observePipVisibility();
initializeCatalog();
renderLessonChrome();
render();
if (initialLessonIdFromHash) {
  window.requestAnimationFrame(enterLesson);
} else {
  window.history.replaceState(null, "", lessonHash(lesson.id));
}
