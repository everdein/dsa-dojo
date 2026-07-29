import { buildValidatedTrace } from "./lesson-contract.mjs";
import { projectArrayView } from "./array-renderer.mjs";
import { getLesson, listLessons } from "./lessons/index.mjs";
import { createPlayerState, playerReducer } from "./player.mjs";

const lessons = listLessons();
const initialLessonId = readLessonIdFromHash() ?? lessons[0].id;
let lesson = getLesson(initialLessonId);
let player = createPlayerState({
  lessonId: lesson.id,
  trace: buildValidatedTrace(lesson, lesson.input.defaultValue),
  input: structuredClone(lesson.input.defaultValue)
});
let timerId = null;

const elements = {
  headerStatus: document.querySelector("#header-status"),
  lessonList: document.querySelector("#lesson-list"),
  lessonEyebrow: document.querySelector("#lesson-eyebrow"),
  lessonTitle: document.querySelector("#lesson-title"),
  lessonSummary: document.querySelector("#lesson-summary"),
  fields: document.querySelector("#lesson-fields"),
  apply: document.querySelector("#apply-button"),
  sample: document.querySelector("#sample-button"),
  help: document.querySelector("#input-help"),
  error: document.querySelector("#input-error"),
  cells: document.querySelector("#array-cells"),
  legend: document.querySelector("#array-legend"),
  stats: document.querySelector("#stat-grid"),
  previous: document.querySelector("#previous-button"),
  next: document.querySelector("#next-button"),
  play: document.querySelector("#play-button"),
  reset: document.querySelector("#reset-button"),
  speed: document.querySelector("#speed-input"),
  speedLabel: document.querySelector("#speed-label"),
  pipCard: document.querySelector(".pip-card"),
  pipToggle: document.querySelector("#pip-toggle"),
  pipHeading: document.querySelector("#pip-heading"),
  pipMessage: document.querySelector("#pip-message"),
  pipPrompt: document.querySelector("#pip-prompt"),
  codeTitle: document.querySelector("#code-title"),
  fileLabel: document.querySelector("#file-label"),
  codeLines: document.querySelector("#code-lines"),
  complexityChip: document.querySelector("#complexity-chip"),
  timeComplexity: document.querySelector("#time-complexity"),
  spaceComplexity: document.querySelector("#space-complexity"),
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
  elements.headerStatus.textContent = `${lesson.topic.toUpperCase()} · ${lessons.length} LESSONS`;
  elements.lessonEyebrow.textContent = `${lesson.topic.toUpperCase()} / LESSON ${String(lesson.order).padStart(2, "0")}`;
  elements.lessonTitle.textContent = lesson.title;
  elements.lessonSummary.textContent = lesson.summary;
  elements.help.textContent = lesson.input.help;
  elements.pipHeading.textContent = lesson.guide.heading;
  elements.codeTitle.textContent = lesson.code.title;
  elements.fileLabel.textContent = lesson.code.filename;
  elements.complexityChip.textContent = lesson.complexity.chip;
  elements.timeComplexity.textContent = lesson.complexity.time;
  elements.spaceComplexity.textContent = lesson.complexity.space;
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
    input.value = serialized[field.id] ?? "";
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.min !== undefined) input.min = String(field.min);
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
    const number = document.createElement("b");
    number.textContent = String(line.number);
    sourceLine.append(number, document.createTextNode(line.text));
    return sourceLine;
  }));
}

function render() {
  const step = player.trace[player.index];
  renderCatalogState();
  renderArray(step);
  renderStats(step);
  renderCodeState(step);
  renderPip(step);

  elements.error.textContent = player.error;
  elements.stepLabel.textContent = player.status.toUpperCase();
  elements.stepCount.textContent = `${player.index} / ${player.trace.length - 1}`;
  elements.previous.disabled = player.index === 0;
  elements.next.disabled = player.index === player.trace.length - 1;
  const playing = player.status === "playing";
  elements.play.innerHTML = playing ? "Ⅱ <span>Pause</span>" : "▶ <span>Play</span>";
  elements.play.setAttribute("aria-label", playing ? "Pause lesson" : "Play lesson");
  elements.speed.value = String(player.speed);
  elements.speedLabel.textContent = speedLabel(player.speed);
  elements.pipCard.classList.toggle("is-minimized", player.guideMinimized);
  elements.pipToggle.textContent = player.guideMinimized ? "+" : "−";
  elements.pipToggle.setAttribute("aria-label", player.guideMinimized ? "Expand Pip" : "Minimize Pip");
  elements.live.textContent = `${lesson.title}. Step ${player.index} of ${player.trace.length - 1}. ${step.narration}`;
}

function renderArray(step) {
  const cells = projectArrayView(step.view);
  const { values } = step.view;
  elements.cells.style.setProperty("--array-count", values.length);
  elements.cells.style.minWidth = `${Math.max(values.length * 66, 280)}px`;
  elements.cells.replaceChildren(...cells.map((model) => {
    const cell = document.createElement("div");
    cell.className = "array-cell";
    cell.dataset.index = String(model.index);
    cell.setAttribute("role", "listitem");

    if (model.active) {
      cell.classList.add("array-cell--active");
    }
    for (const range of model.ranges) {
      cell.classList.add(`array-cell--range-${range.kind}`);
      if (range.isStart) cell.classList.add("array-cell--range-start");
      if (range.isEnd) cell.classList.add("array-cell--range-end");
    }
    for (const marker of model.markers) {
      cell.classList.add(`array-cell--marker-${marker.kind}`);
      cell.dataset.marker = marker.label;
    }
    const annotation = model.annotations[0];
    if (annotation) {
      const note = document.createElement("span");
      note.className = "array-annotation";
      note.textContent = annotation.label;
      cell.append(note);
    }
    const valueLabel = document.createElement("span");
    valueLabel.textContent = model.formattedValue;
    cell.append(valueLabel);
    cell.setAttribute("aria-label", model.ariaLabel);
    return cell;
  }));
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
  document.querySelectorAll(".code-line").forEach((line) => {
    const steps = line.dataset.codeSteps.split(" ");
    line.classList.toggle("is-active", step.codeSteps.some((codeStep) => steps.includes(codeStep)));
  });
}

function renderPip(step) {
  elements.pipMessage.textContent = step.narration;
  elements.pipPrompt.textContent = step.prompt;
}

function loadLesson(id) {
  if (id === lesson.id) return;
  stopTimer();
  lesson = getLesson(id);
  const input = structuredClone(lesson.input.defaultValue);
  const trace = buildValidatedTrace(lesson, input);
  player = playerReducer(player, { type: "LOAD_LESSON", lessonId: lesson.id, trace, input });
  window.history.replaceState(null, "", `#lesson=${lesson.id}`);
  renderLessonChrome();
  render();
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

function speedLabel(speed) {
  if (speed <= 500) return "1.5×";
  if (speed >= 1100) return "0.75×";
  return "1×";
}

function readLessonIdFromHash() {
  const match = window.location.hash.match(/^#lesson=(.+)$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return lessons.some((item) => item.id === id) ? id : null;
}

elements.apply.addEventListener("click", applyCurrentInput);
elements.sample.addEventListener("click", loadSample);
elements.previous.addEventListener("click", () => move({ type: "PREVIOUS" }));
elements.next.addEventListener("click", () => move({ type: "NEXT" }));
elements.play.addEventListener("click", () => {
  if (player.status === "playing") pausePlayback();
  else startPlayback();
});
elements.reset.addEventListener("click", () => move({ type: "RESET" }));
elements.speed.addEventListener("input", () => {
  const wasPlaying = player.status === "playing";
  player = playerReducer(player, { type: "SET_SPEED", speed: Number(elements.speed.value) });
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
  const id = readLessonIdFromHash();
  if (id && id !== lesson.id) loadLesson(id);
});

initializeCatalog();
renderLessonChrome();
render();
