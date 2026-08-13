import { buildValidatedTrace } from "./lesson-contract.mjs";
import { buildCurriculumMap, curriculumMapSelection } from "./curriculum-map.mjs";
import { groupCurriculumByTopic } from "./home-catalog.mjs";
import { getLesson, listLessons } from "./lessons/index.mjs";
import { lessonHash, readLessonIdFromHash } from "./navigation.mjs";
import {
  catalogFilterOptions,
  catalogFilterStateFromUrl,
  catalogFilterUrl,
  filterCatalogLessons,
  hasActiveCatalogFilters
} from "./catalog-filters.mjs";
import {
  answerChallenge,
  buildChallengeQuestion,
  challengeSummary,
  createChallengeSession,
  readChallengePreferences,
  recordChallengeBest,
  setChallengePreference,
  skipChallenge,
  writeChallengePreferences
} from "./challenge-mode.mjs";
import {
  comparisonFamilies,
  comparisonFamilyForLesson,
  comparisonReducer,
  comparisonSummary,
  createComparisonRun,
  getComparisonFamily
} from "./comparison-mode.mjs";
import {
  clearLearningProgress,
  learningProgressSummary,
  lessonProgressState,
  readLearningProgress
} from "./learning-progress.mjs";
import { createPlaybackClock, getBrowserStorage } from "./browser-runtime.mjs";
import {
  persistLessonSession,
  restoreLessonPlayer,
  restoreLessonState as restoreSessionState,
  restoreSharedLessonPlayer as restoreSharedSessionPlayer
} from "./lesson-session.mjs";
import {
  mountPips,
  observePipVisibility,
  pipEmotionForLearning,
  pipEmotionLabel,
  pipSenseiLine,
  setPipState
} from "./pip.mjs";
import { playerReducer } from "./player.mjs";
import { renderLessonVisualization } from "./visualization-view.mjs";
import { createShareController } from "./share-controller.mjs";
import {
  createComparisonShareState,
  createLessonShareState,
  readShareStateFromUrl,
  removeShareStateFromUrl
} from "./shareable-state.mjs";
import {
  controlValueToPlaybackDelay,
  playbackDelayToControlValue,
  playbackSpeedLabel
} from "./speed.mjs";

const lessons = listLessons();
const lessonIds = lessons.map((item) => item.id);
const topicCount = new Set(lessons.map((item) => item.topic)).size;
const curriculumMap = buildCurriculumMap(lessons);
const progressStorage = getBrowserStorage(window);
let progress = readLearningProgress(progressStorage, lessons);
let challengePreferences = readChallengePreferences(progressStorage, lessons);
let catalogFilters = catalogFilterStateFromUrl(window.location.href);
const initialShared = readShareStateFromUrl(window.location.href);
const initialLessonIdFromHash = readLessonIdFromHash(window.location.hash, lessonIds);
const initialSharedLessonId = initialShared.state?.kind === "lesson" && lessonIds.includes(initialShared.state.lessonId)
  ? initialShared.state.lessonId
  : null;
const initialLessonId = initialSharedLessonId ?? initialLessonIdFromHash ?? progress.lastLessonId ?? lessons[0].id;
let lesson = getLesson(initialLessonId);
const sharedLessonRestore = initialSharedLessonId ? restoreSharedLessonPlayer(lesson, initialShared.state) : null;
let shareRestoreError = initialShared.error
  ?? (initialShared.state?.kind === "lesson" && !initialSharedLessonId ? "The shared lesson is not in this curriculum." : null)
  ?? sharedLessonRestore?.error
  ?? null;
let player = sharedLessonRestore?.player ?? createRestoredPlayer(lesson);
if (initialShared.state) challengePreferences = { ...challengePreferences, enabled: false };
if (challengePreferences.enabled) player = playerReducer(player, { type: "RESET" });
let challenge = createChallengeSession(lesson.id, player.trace);
let comparisonFamily = getComparisonFamily("sorting-strategies");
let comparisonRun = null;
const playbackClock = createPlaybackClock(window);
let prediction = createPredictionState(lesson.id);
let selectedMapLessonId = lesson.id;
let selectedMapPattern = "all";
let catalogView = "list";
const mapNodeElements = new Map();

const elements = {
  headerStatus: document.querySelector("#header-status"),
  catalogCount: document.querySelector("#catalog-count"),
  catalogSummary: document.querySelector("#catalog-summary"),
  catalogListView: document.querySelector("#catalog-list-view"),
  catalogMapView: document.querySelector("#catalog-map-view"),
  catalogTools: document.querySelector("#catalog-tools"),
  catalogSearch: document.querySelector("#catalog-search"),
  catalogTopicFilter: document.querySelector("#catalog-topic-filter"),
  catalogPatternFilter: document.querySelector("#catalog-pattern-filter"),
  catalogProgressFilter: document.querySelector("#catalog-progress-filter"),
  clearCatalogFilters: document.querySelector("#clear-catalog-filters"),
  catalogResultsSummary: document.querySelector("#catalog-results-summary"),
  catalogResults: document.querySelector(".catalog-results"),
  catalogEmpty: document.querySelector("#catalog-empty"),
  catalogEmptyClear: document.querySelector("#catalog-empty-clear"),
  progressSummary: document.querySelector("#progress-summary"),
  progressMeter: document.querySelector("#progress-meter"),
  progressMeterFill: document.querySelector("#progress-meter-fill"),
  continueLearning: document.querySelector("#continue-learning-button"),
  resetProgress: document.querySelector("#reset-progress-button"),
  resetProgressConfirmation: document.querySelector("#progress-reset-confirmation"),
  cancelResetProgress: document.querySelector("#cancel-reset-progress-button"),
  confirmResetProgress: document.querySelector("#confirm-reset-progress-button"),
  lessonList: document.querySelector("#lesson-list"),
  curriculumMap: document.querySelector("#curriculum-map"),
  curriculumMapPattern: document.querySelector("#curriculum-map-pattern"),
  curriculumMapScroll: document.querySelector("#curriculum-map-scroll"),
  curriculumMapCanvas: document.querySelector("#curriculum-map-canvas"),
  curriculumMapEdges: document.querySelector("#curriculum-map-edges"),
  curriculumMapColumns: document.querySelector("#curriculum-map-columns"),
  curriculumMapDetail: document.querySelector("#curriculum-map-detail"),
  lessonSection: document.querySelector("#lesson"),
  lessonEyebrow: document.querySelector("#lesson-eyebrow"),
  lessonTitle: document.querySelector("#lesson-title"),
  lessonSummary: document.querySelector("#lesson-summary"),
  lessonGrid: document.querySelector("#lesson-grid"),
  reflection: document.querySelector("#reflection"),
  openComparison: document.querySelector("#open-comparison-button"),
  comparisonLaunch: document.querySelector("#comparison-launch"),
  comparisonWorkspace: document.querySelector("#comparison-workspace"),
  comparisonEyebrow: document.querySelector("#comparison-eyebrow"),
  comparisonTitle: document.querySelector("#comparison-title"),
  comparisonSummary: document.querySelector("#comparison-summary"),
  comparisonExit: document.querySelector("#comparison-exit"),
  comparisonForm: document.querySelector("#comparison-form"),
  comparisonFamily: document.querySelector("#comparison-family"),
  comparisonLeft: document.querySelector("#comparison-left"),
  comparisonRight: document.querySelector("#comparison-right"),
  comparisonFields: document.querySelector("#comparison-fields"),
  comparisonSample: document.querySelector("#comparison-sample"),
  comparisonHelp: document.querySelector("#comparison-help"),
  comparisonError: document.querySelector("#comparison-error"),
  comparisonResult: document.querySelector("#comparison-result"),
  comparisonPrevious: document.querySelector("#comparison-previous"),
  comparisonPlay: document.querySelector("#comparison-play"),
  comparisonNext: document.querySelector("#comparison-next"),
  comparisonReset: document.querySelector("#comparison-reset"),
  comparisonSpeed: document.querySelector("#comparison-speed"),
  comparisonSpeedLabel: document.querySelector("#comparison-speed-label"),
  shareStateButton: document.querySelector("#share-state-button"),
  shareStateStatus: document.querySelector("#share-state-status"),
  shareStateNotice: document.querySelector("#share-state-notice"),
  shareStateNoticeCopy: document.querySelector("#share-state-notice-copy"),
  dismissShareStateNotice: document.querySelector("#dismiss-share-state-notice"),
  challengeToggle: document.querySelector("#challenge-toggle"),
  challengeToggleStatus: document.querySelector("#challenge-toggle-status"),
  challengeCard: document.querySelector("#challenge-card"),
  challengeTitle: document.querySelector("#challenge-title"),
  challengeProgress: document.querySelector("#challenge-progress"),
  challengePrompt: document.querySelector("#challenge-prompt"),
  challengeForm: document.querySelector("#challenge-form"),
  challengeOptions: document.querySelector("#challenge-options"),
  challengeError: document.querySelector("#challenge-error"),
  challengeSkip: document.querySelector("#challenge-skip"),
  challengeFeedback: document.querySelector("#challenge-feedback"),
  challengeFeedbackLabel: document.querySelector("#challenge-feedback-label"),
  challengeFeedbackTitle: document.querySelector("#challenge-feedback-title"),
  challengeFeedbackCopy: document.querySelector("#challenge-feedback-copy"),
  challengeScore: document.querySelector("#challenge-score"),
  challengeStreak: document.querySelector("#challenge-streak"),
  challengeBest: document.querySelector("#challenge-best"),
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
  pipEmotionLabel: document.querySelector("#pip-emotion-label"),
  pipSenseiLine: document.querySelector("#pip-sensei-line"),
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

const shareController = createShareController({
  browserWindow: window,
  browserDocument: document,
  browserNavigator: navigator,
  elements: {
    status: elements.shareStateStatus,
    notice: elements.shareStateNotice,
    noticeCopy: elements.shareStateNoticeCopy
  },
  getSnapshot: currentShareSnapshot
});

function initializeCatalog() {
  initializeCatalogFilters();
  initializeCurriculumMap();
  const groups = groupCurriculumByTopic(lessons);
  elements.lessonList.replaceChildren(...groups.map((group, groupIndex) => {
    const topicId = `studio-topic-${String(groupIndex + 1).padStart(2, "0")}`;
    const section = document.createElement("section");
    section.className = "lesson-topic-group";
    section.dataset.topic = group.topic;
    section.setAttribute("aria-labelledby", `${topicId}-title`);

    const heading = document.createElement("div");
    heading.className = "lesson-topic-heading";
    const headingCopy = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = `TOPIC ${String(groupIndex + 1).padStart(2, "0")} OF ${String(groups.length).padStart(2, "0")}`;
    const title = document.createElement("h3");
    title.id = `${topicId}-title`;
    title.textContent = group.topic;
    headingCopy.append(eyebrow, title);
    const count = document.createElement("span");
    count.className = "lesson-topic-count";
    count.textContent = `${group.lessons.length} ${group.lessons.length === 1 ? "lesson" : "lessons"}`;
    heading.append(headingCopy, count);

    const cards = document.createElement("div");
    cards.className = "lesson-topic-cards";
    cards.append(...group.lessons.map(createLessonButton));
    section.append(heading, cards);
    return section;
  }));
}

function initializeCurriculumMap() {
  elements.curriculumMapPattern.append(...curriculumMap.patterns.map(({ id, count }) => (
    createFilterOption(id, `${id.replaceAll("-", " ")} (${count})`)
  )));

  const columns = curriculumMap.columns.map((nodes, depth) => {
    const column = document.createElement("section");
    column.className = "curriculum-map-column";
    column.setAttribute("aria-label", `Learning stage ${depth + 1}`);
    const heading = document.createElement("p");
    heading.className = "curriculum-map-column-heading";
    heading.textContent = depth === 0 ? "Start here" : `Stage ${depth + 1}`;
    column.append(heading, ...nodes.map(createCurriculumMapNode));
    return column;
  });
  elements.curriculumMapColumns.replaceChildren(...columns);
  renderCurriculumMapSelection();
}

function createCurriculumMapNode(node) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "curriculum-map-node";
  button.dataset.mapLessonId = node.id;
  button.setAttribute("aria-pressed", "false");
  const eyebrow = document.createElement("small");
  eyebrow.textContent = `L${String(node.order).padStart(2, "0")} · ${node.topic}`;
  const title = document.createElement("strong");
  title.textContent = node.label;
  const pattern = document.createElement("span");
  pattern.textContent = node.patterns.slice(0, 2).join(" · ").replaceAll("-", " ");
  button.append(eyebrow, title, pattern);
  button.addEventListener("click", () => selectCurriculumMapLesson(node.id));
  mapNodeElements.set(node.id, button);
  return button;
}

function setCatalogView(view) {
  catalogView = view === "map" ? "map" : "list";
  const mapIsOpen = catalogView === "map";
  elements.catalogListView.setAttribute("aria-pressed", String(!mapIsOpen));
  elements.catalogMapView.setAttribute("aria-pressed", String(mapIsOpen));
  elements.curriculumMap.hidden = !mapIsOpen;
  elements.catalogTools.hidden = mapIsOpen;
  elements.catalogResults.hidden = mapIsOpen;
  elements.catalogEmpty.hidden = mapIsOpen || !elements.catalogEmpty.dataset.empty;
  elements.lessonList.hidden = mapIsOpen;
  if (mapIsOpen) {
    renderCurriculumMapSelection();
    requestAnimationFrame(renderCurriculumMapEdges);
  }
}

function selectCurriculumMapLesson(id, { focus = false } = {}) {
  selectedMapLessonId = id;
  renderCurriculumMapSelection();
  if (focus) mapNodeElements.get(id)?.focus();
}

function renderCurriculumMapSelection() {
  const selection = curriculumMapSelection(curriculumMap, selectedMapLessonId, selectedMapPattern);
  const matching = new Set(selection.matchingPatternIds);
  const prerequisites = new Set(selection.prerequisiteIds);
  const dependents = new Set(selection.dependentIds);
  for (const [id, button] of mapNodeElements) {
    const onSelectedPath = id === selectedMapLessonId || prerequisites.has(id) || dependents.has(id);
    button.classList.toggle("is-selected", id === selectedMapLessonId);
    button.classList.toggle("is-prerequisite", prerequisites.has(id));
    button.classList.toggle("is-dependent", dependents.has(id));
    button.classList.toggle("is-dimmed", selectedMapPattern !== "all" && !matching.has(id) && !onSelectedPath);
    button.setAttribute("aria-pressed", String(id === selectedMapLessonId));
  }
  renderCurriculumMapDetail(curriculumMap.nodeById.get(selectedMapLessonId));
  for (const path of elements.curriculumMapEdges.querySelectorAll(".curriculum-map-edge")) {
    path.classList.toggle("is-active", selection.activeEdgeIds.includes(path.dataset.edgeId));
  }
}

function renderCurriculumMapDetail(node) {
  const copy = document.createElement("div");
  copy.className = "curriculum-map-detail-copy";
  const eyebrow = document.createElement("small");
  eyebrow.textContent = `L${String(node.order).padStart(2, "0")} · ${node.topic.toUpperCase()}`;
  const title = document.createElement("h4");
  title.textContent = node.label;
  const description = document.createElement("p");
  description.textContent = node.description;
  copy.append(eyebrow, title, description);

  const relations = document.createElement("div");
  relations.className = "curriculum-map-relations";
  relations.append(
    createMapRelation("Needs", node.prerequisites, "Start of path"),
    createMapRelation("Unlocks", node.dependents, "End of path"),
    createMapPatternRelation(node.patterns)
  );

  const open = document.createElement("button");
  open.type = "button";
  open.className = "primary-button";
  open.textContent = "Open lesson →";
  open.addEventListener("click", () => loadLesson(node.id));
  elements.curriculumMapDetail.replaceChildren(copy, relations, open);
}

function createMapRelation(label, ids, emptyLabel) {
  const row = document.createElement("div");
  row.className = "curriculum-map-relation";
  const heading = document.createElement("strong");
  heading.textContent = label;
  row.append(heading);
  if (ids.length === 0) {
    const empty = document.createElement("span");
    empty.className = "curriculum-map-chip";
    empty.textContent = emptyLabel;
    row.append(empty);
    return row;
  }
  for (const id of ids) {
    const related = curriculumMap.nodeById.get(id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "curriculum-map-chip";
    button.textContent = `L${String(related.order).padStart(2, "0")} ${related.label}`;
    button.addEventListener("click", () => selectCurriculumMapLesson(id, { focus: true }));
    row.append(button);
  }
  return row;
}

function createMapPatternRelation(patterns) {
  const row = document.createElement("div");
  row.className = "curriculum-map-relation";
  const heading = document.createElement("strong");
  heading.textContent = "Patterns";
  row.append(heading);
  for (const pattern of patterns) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "curriculum-map-chip";
    button.textContent = pattern.replaceAll("-", " ");
    button.addEventListener("click", () => {
      selectedMapPattern = pattern;
      elements.curriculumMapPattern.value = pattern;
      renderCurriculumMapSelection();
    });
    row.append(button);
  }
  return row;
}

function renderCurriculumMapEdges() {
  if (elements.curriculumMap.hidden) return;
  const canvasRect = elements.curriculumMapCanvas.getBoundingClientRect();
  const width = elements.curriculumMapCanvas.scrollWidth;
  const height = elements.curriculumMapCanvas.scrollHeight;
  elements.curriculumMapEdges.setAttribute("viewBox", `0 0 ${width} ${height}`);
  elements.curriculumMapEdges.setAttribute("width", String(width));
  elements.curriculumMapEdges.setAttribute("height", String(height));
  const paths = curriculumMap.edges.map((edge) => {
    const source = mapNodeElements.get(edge.source).getBoundingClientRect();
    const target = mapNodeElements.get(edge.target).getBoundingClientRect();
    const startX = source.right - canvasRect.left;
    const startY = source.top + source.height / 2 - canvasRect.top;
    const endX = target.left - canvasRect.left;
    const endY = target.top + target.height / 2 - canvasRect.top;
    const bend = Math.max(24, (endX - startX) * 0.45);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("curriculum-map-edge");
    path.dataset.edgeId = edge.id;
    path.setAttribute("d", `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`);
    return path;
  });
  elements.curriculumMapEdges.replaceChildren(...paths);
  renderCurriculumMapSelection();
}

function createLessonButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lesson-card";
  button.dataset.lessonId = item.id;
  button.setAttribute("aria-current", "false");

  const number = document.createElement("span");
  number.className = "lesson-card-number";
  number.textContent = `L${String(item.order).padStart(2, "0")}`;
  const copy = document.createElement("span");
  copy.className = "lesson-card-copy";
  const pattern = document.createElement("small");
  pattern.textContent = (item.patterns[0] ?? item.topic).replaceAll("-", " ");
  const title = document.createElement("strong");
  title.textContent = item.catalogLabel;
  const description = document.createElement("span");
  description.textContent = item.catalogDescription;
  const progressLabel = document.createElement("span");
  progressLabel.className = "lesson-card-progress";
  copy.append(pattern, title, description, progressLabel);
  const arrow = document.createElement("span");
  arrow.className = "lesson-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  button.append(number, copy, arrow);
  button.addEventListener("click", () => loadLesson(item.id));
  return button;
}

function renderCatalogState() {
  const summary = learningProgressSummary(progress, lessons);
  const visibleIds = new Set(filterCatalogLessons(
    lessons,
    catalogFilters,
    (id) => lessonProgressState(progress, id).status
  ).map(({ id }) => id));
  elements.lessonList.querySelectorAll(".lesson-card").forEach((button) => {
    const state = lessonProgressState(progress, button.dataset.lessonId);
    button.setAttribute("aria-current", button.dataset.lessonId === lesson.id ? "true" : "false");
    button.dataset.progress = state.status;
    button.querySelector(".lesson-card-progress").textContent = state.status === "complete"
      ? "✓ Complete"
      : state.label;
    button.hidden = !visibleIds.has(button.dataset.lessonId);
  });
  elements.lessonList.querySelectorAll(".lesson-topic-group").forEach((section) => {
    section.classList.toggle("is-current", section.dataset.topic === lesson.topic);
    const topicLessons = lessons.filter((item) => item.topic === section.dataset.topic);
    const complete = topicLessons.filter((item) => summary.completedIds.has(item.id)).length;
    section.querySelector(".lesson-topic-count").textContent = `${complete} of ${topicLessons.length} complete`;
    section.hidden = !topicLessons.some((item) => visibleIds.has(item.id));
  });
  elements.progressSummary.textContent = `${summary.completed} of ${summary.total} lessons complete · ${summary.percent}%`;
  elements.progressMeter.setAttribute("aria-valuemax", String(summary.total));
  elements.progressMeter.setAttribute("aria-valuenow", String(summary.completed));
  elements.progressMeterFill.style.width = `${summary.percent}%`;
  const continuedLesson = summary.lastLessonId ? getLesson(summary.lastLessonId) : null;
  elements.continueLearning.hidden = continuedLesson === null;
  if (continuedLesson) elements.continueLearning.textContent = `Continue ${continuedLesson.catalogLabel} →`;
  elements.catalogResultsSummary.textContent = visibleIds.size === lessons.length
    ? `Showing all ${lessons.length} lessons.`
    : `Showing ${visibleIds.size} of ${lessons.length} lessons.`;
  elements.catalogEmpty.dataset.empty = String(visibleIds.size === 0);
  elements.catalogEmpty.hidden = catalogView === "map" || visibleIds.size !== 0;
  elements.clearCatalogFilters.hidden = !hasActiveCatalogFilters(catalogFilters);
  for (const [id, button] of mapNodeElements) {
    button.dataset.progress = lessonProgressState(progress, id).status;
  }
}

function initializeCatalogFilters() {
  const options = catalogFilterOptions(lessons);
  elements.catalogTopicFilter.append(...options.topics.map((topic) => createFilterOption(topic, topic)));
  elements.catalogPatternFilter.append(...options.patterns.map((pattern) => createFilterOption(pattern, pattern.replaceAll("-", " "))));
  if (!options.topics.includes(catalogFilters.topic)) catalogFilters.topic = "all";
  if (!options.patterns.includes(catalogFilters.pattern)) catalogFilters.pattern = "all";
  syncCatalogFilterControls();
}

function createFilterOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function syncCatalogFilterControls() {
  elements.catalogSearch.value = catalogFilters.query;
  elements.catalogTopicFilter.value = catalogFilters.topic;
  elements.catalogPatternFilter.value = catalogFilters.pattern;
  elements.catalogProgressFilter.value = catalogFilters.progress;
}

function updateCatalogFilters() {
  catalogFilters = {
    query: elements.catalogSearch.value,
    topic: elements.catalogTopicFilter.value,
    pattern: elements.catalogPatternFilter.value,
    progress: elements.catalogProgressFilter.value
  };
  const nextUrl = catalogFilterUrl(window.location.href, catalogFilters);
  window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  renderCatalogState();
}

function clearCatalogFilters() {
  catalogFilters = catalogFilterStateFromUrl(new URL(window.location.pathname + window.location.hash, window.location.origin));
  syncCatalogFilterControls();
  updateCatalogFilters();
  elements.catalogSearch.focus();
}

function renderLessonChrome() {
  const topicLabel = topicCount === 1 ? "TOPIC" : "TOPICS";
  elements.headerStatus.textContent = `${topicCount} ${topicLabel} · ${lessons.length} LESSONS`;
  elements.catalogCount.textContent = `CURRICULUM · ${topicCount} ${topicLabel}`;
  elements.catalogSummary.textContent = `${lessons.length} focused lessons build reusable reasoning patterns one state change at a time.`;
  elements.lessonEyebrow.textContent = `${lesson.topic.toUpperCase()} / LESSON ${String(lesson.order).padStart(2, "0")}`;
  elements.lessonTitle.textContent = lesson.title;
  elements.lessonSummary.textContent = lesson.summary;
  elements.inputTitle.textContent = lesson.input.heading ?? "Your data";
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
  const comparable = comparisonFamilyForLesson(lesson.id);
  elements.comparisonLaunch.hidden = comparable === null;
  if (comparable) {
    elements.comparisonLaunch.setAttribute("aria-label", `Compare ${lesson.catalogLabel} with another ${comparable.label.toLowerCase()} algorithm`);
  }
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
  if (comparisonRun) {
    renderComparison();
    return;
  }
  persistCurrentProgress();
  const step = player.trace[player.index];
  renderCatalogState();
  renderVisualization(step);
  renderStats(step);
  renderCodeState(step);
  renderChallenge();
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
  const challengeAnswer = currentChallengeAnswer();
  elements.next.disabled = player.index === player.trace.length - 1
    || (challengePreferences.enabled && challengeAnswer === null);
  elements.next.textContent = challengePreferences.enabled
    ? player.index === player.trace.length - 1
      ? "Round complete"
      : challengeAnswer === null ? "Choose an answer" : "Reveal next state →"
    : player.index === 0 && prediction.locked ? "Reveal next step →" : "Next →";
  const playing = player.status === "playing";
  elements.play.innerHTML = playing ? "Ⅱ <span>Pause</span>" : "▶ <span>Play</span>";
  elements.play.disabled = challengePreferences.enabled;
  elements.play.setAttribute("aria-label", challengePreferences.enabled
    ? "Autoplay unavailable in Challenge Mode"
    : playing ? "Pause lesson" : "Play lesson");
  const speedText = playbackSpeedLabel(player.speed);
  elements.speed.value = String(playbackDelayToControlValue(player.speed));
  elements.speedLabel.textContent = speedText;
  elements.speed.setAttribute("aria-valuetext", `${speedText} speed`);
  elements.speed.disabled = challengePreferences.enabled;
  elements.pipCard.classList.toggle("is-minimized", player.guideMinimized);
  elements.pipToggle.textContent = player.guideMinimized ? "+" : "−";
  elements.pipToggle.setAttribute("aria-label", player.guideMinimized ? "Expand Pip" : "Minimize Pip");
  elements.pipToggle.setAttribute("aria-expanded", String(!player.guideMinimized));
  elements.live.textContent = `${lesson.title}. Step ${player.index} of ${player.trace.length - 1}. ${step.narration}`;
}

function renderVisualization(step) {
  renderLessonVisualization(lesson, step, elements.visualizationRoot);
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

function initializeComparisonMode() {
  elements.comparisonFamily.replaceChildren(...comparisonFamilies.map((family) => {
    const option = document.createElement("option");
    option.value = family.id;
    option.textContent = family.label;
    return option;
  }));
}

function openComparison(familyId = null, preferredLessonId = null) {
  stopTimer();
  clearSharedUrlState();
  comparisonFamily = getComparisonFamily(
    familyId ?? comparisonFamilyForLesson(preferredLessonId ?? lesson.id)?.id ?? "sorting-strategies"
  );
  const preferred = comparisonFamily.lessonIds.includes(preferredLessonId ?? lesson.id)
    ? preferredLessonId ?? lesson.id
    : comparisonFamily.defaultPair[0];
  const other = comparisonFamily.defaultPair.find((id) => id !== preferred)
    ?? comparisonFamily.lessonIds.find((id) => id !== preferred);
  populateComparisonAlgorithms(preferred, other);
  comparisonRun = buildComparisonRun(comparisonInputForLaunch(preferredLessonId));
  renderComparisonFields();
  renderComparison();
  elements.lessonSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
  elements.comparisonTitle.focus?.({ preventScroll: true });
}

function restoreSharedComparison(state) {
  try {
    comparisonFamily = getComparisonFamily(state.familyId);
    if (!comparisonFamily.lessonIds.includes(state.leftLessonId)
      || !comparisonFamily.lessonIds.includes(state.rightLessonId)) {
      throw new Error("The shared algorithms do not belong to this comparison.");
    }
    populateComparisonAlgorithms(state.leftLessonId, state.rightLessonId);
    const input = comparisonFamily.input.parse(state.fields);
    comparisonRun = buildComparisonRun(input);
    if (state.leftIndex >= comparisonRun.left.trace.length || state.rightIndex >= comparisonRun.right.trace.length) {
      throw new Error("A shared comparison step is outside its trace.");
    }
    comparisonRun = comparisonReducer(comparisonRun, { type: "STEP_SIDE", side: "left", index: state.leftIndex });
    comparisonRun = comparisonReducer(comparisonRun, { type: "STEP_SIDE", side: "right", index: state.rightIndex });
    renderComparisonFields();
    renderComparison();
    return null;
  } catch (error) {
    comparisonRun = null;
    return error.message;
  }
}

function comparisonInputForLaunch(preferredLessonId) {
  if (preferredLessonId === lesson.id && comparisonFamily.lessonIds.includes(lesson.id)) {
    try {
      return comparisonFamily.input.parse(comparisonFamily.input.serialize(player.input));
    } catch {
      // The shared family bound can be narrower than one lesson's standalone bound.
    }
  }
  return structuredClone(comparisonFamily.input.defaultValue);
}

function closeComparison() {
  stopTimer();
  clearSharedUrlState();
  comparisonRun = null;
  elements.comparisonWorkspace.hidden = true;
  elements.lessonGrid.hidden = false;
  elements.reflection.hidden = false;
  elements.challengeToggle.hidden = false;
  renderLessonChrome();
  render();
  const returnTarget = comparisonFamilyForLesson(lesson.id)
    ? elements.comparisonLaunch
    : elements.openComparison;
  returnTarget.focus({ preventScroll: true });
}

function populateComparisonAlgorithms(leftId, rightId) {
  const createOptions = () => comparisonFamily.lessonIds.map((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = getLesson(id).catalogLabel;
    return option;
  });
  elements.comparisonLeft.replaceChildren(...createOptions());
  elements.comparisonRight.replaceChildren(...createOptions());
  elements.comparisonFamily.value = comparisonFamily.id;
  elements.comparisonLeft.value = leftId;
  elements.comparisonRight.value = rightId;
  syncComparisonAlgorithmOptions();
}

function syncComparisonAlgorithmOptions() {
  for (const option of elements.comparisonLeft.options) {
    option.disabled = option.value === elements.comparisonRight.value;
  }
  for (const option of elements.comparisonRight.options) {
    option.disabled = option.value === elements.comparisonLeft.value;
  }
}

function renderComparisonFields() {
  const serialized = comparisonFamily.input.serialize(comparisonRun.input);
  elements.comparisonFields.replaceChildren(...comparisonFamily.input.fields.map((field) => {
    const label = document.createElement("label");
    const text = document.createElement("span");
    text.textContent = field.label;
    const input = document.createElement("input");
    input.dataset.comparisonField = field.id;
    input.type = field.type;
    input.inputMode = field.inputMode;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = serialized[field.id] ?? "";
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    if (field.step !== undefined) input.step = field.step;
    label.append(text, input);
    return label;
  }));
  elements.comparisonHelp.textContent = comparisonFamily.input.help;
}

function collectComparisonFields() {
  return Object.fromEntries(
    [...elements.comparisonFields.querySelectorAll("[data-comparison-field]")]
      .map((input) => [input.dataset.comparisonField, input.value])
  );
}

function buildComparisonRun(input) {
  return createComparisonRun({
    family: comparisonFamily,
    leftLesson: getLesson(elements.comparisonLeft.value),
    rightLesson: getLesson(elements.comparisonRight.value),
    input,
    speed: comparisonRun?.speed ?? player.speed
  });
}

function rebuildComparison(input = comparisonRun.input) {
  stopTimer();
  clearSharedUrlState();
  try {
    comparisonRun = buildComparisonRun(structuredClone(input));
    elements.comparisonError.textContent = "";
    syncComparisonAlgorithmOptions();
    renderComparisonFields();
    renderComparison();
  } catch (error) {
    elements.comparisonError.textContent = error.message;
  }
}

function renderComparison() {
  const summary = comparisonSummary(comparisonRun);
  elements.comparisonWorkspace.hidden = false;
  elements.lessonGrid.hidden = true;
  elements.reflection.hidden = true;
  elements.challengeToggle.hidden = true;
  elements.comparisonLaunch.hidden = true;
  elements.lessonEyebrow.textContent = "COMPARISON LAB";
  elements.lessonTitle.textContent = comparisonFamily.label;
  elements.lessonSummary.textContent = comparisonFamily.summary;
  elements.stepLabel.textContent = comparisonRun.status.toUpperCase();
  elements.stepCount.textContent = `${comparisonRun.left.index}/${summary.leftTransitions} · ${comparisonRun.right.index}/${summary.rightTransitions}`;
  elements.comparisonEyebrow.textContent = comparisonFamily.eyebrow;
  elements.comparisonTitle.textContent = comparisonFamily.label;
  elements.comparisonSummary.textContent = comparisonFamily.summary;
  elements.comparisonFamily.value = comparisonFamily.id;

  renderComparisonResult(summary);
  renderComparisonLane("left");
  renderComparisonLane("right");

  const atStart = comparisonRun.left.index === 0 && comparisonRun.right.index === 0;
  elements.comparisonPrevious.disabled = atStart;
  elements.comparisonNext.disabled = summary.bothComplete;
  const playing = comparisonRun.status === "playing";
  elements.comparisonPlay.innerHTML = playing ? "Ⅱ <span>Pause together</span>" : "▶ <span>Play together</span>";
  elements.comparisonPlay.setAttribute("aria-label", playing ? "Pause comparison" : "Play comparison");
  const speedText = playbackSpeedLabel(comparisonRun.speed);
  elements.comparisonSpeed.value = String(playbackDelayToControlValue(comparisonRun.speed));
  elements.comparisonSpeedLabel.textContent = speedText;
  elements.live.textContent = `${comparisonFamily.label}. Left step ${comparisonRun.left.index} of ${summary.leftTransitions}: ${comparisonRun.left.trace[comparisonRun.left.index].narration} Right step ${comparisonRun.right.index} of ${summary.rightTransitions}: ${comparisonRun.right.trace[comparisonRun.right.index].narration}`;
}

function renderComparisonResult(summary) {
  const match = document.createElement("strong");
  match.textContent = summary.resultsMatch ? "Same result ✓" : "Results differ";
  const result = document.createElement("span");
  result.textContent = summary.resultText;
  const transition = document.createElement("span");
  transition.textContent = summary.leftTransitions === summary.rightTransitions
    ? `${summary.leftTransitions} recorded transitions on each trace`
    : `${summary.leftTransitions} vs ${summary.rightTransitions} recorded transitions`;
  elements.comparisonResult.replaceChildren(match, result, transition);
}

function renderComparisonLane(side) {
  const state = comparisonRun[side];
  const currentLesson = getLesson(state.lessonId);
  const step = state.trace[state.index];
  const lastIndex = state.trace.length - 1;
  comparisonElement(side, "topic").textContent = `${currentLesson.topic.toUpperCase()} · ${currentLesson.complexity.chip}`;
  comparisonElement(side, "title").textContent = currentLesson.catalogLabel;
  comparisonElement(side, "step").textContent = `${state.index} / ${lastIndex}`;
  const time = document.createElement("span");
  time.textContent = `${currentLesson.complexity.time} time`;
  const space = document.createElement("span");
  space.textContent = `${currentLesson.complexity.space} ${currentLesson.complexity.spaceLabel ?? "space"}`;
  const transitions = document.createElement("span");
  transitions.textContent = `${lastIndex} recorded transitions`;
  comparisonElement(side, "complexity").replaceChildren(time, space, transitions);
  renderLessonVisualization(currentLesson, step, comparisonElement(side, "visual"), { panelHeadingLevel: 5 });
  comparisonElement(side, "narration").textContent = step.narration;
  renderComparisonCode(currentLesson, step, comparisonElement(side, "code"));

  const previous = elements.comparisonWorkspace.querySelector(`[data-comparison-action="previous"][data-side="${side}"]`);
  const next = elements.comparisonWorkspace.querySelector(`[data-comparison-action="next"][data-side="${side}"]`);
  previous.disabled = state.index === 0;
  next.disabled = state.index === lastIndex;
}

function renderComparisonCode(currentLesson, step, root) {
  const lines = currentLesson.code.lines.filter((line) => (
    line.steps.some((codeStep) => step.codeSteps.includes(codeStep))
  ));
  const line = lines.find((item) => item.text.trim()) ?? lines[0];
  const number = document.createElement("strong");
  number.textContent = `L${line.number}`;
  root.replaceChildren(number, document.createTextNode(line.text.trim() || "Code block boundary"));
}

function comparisonElement(side, suffix) {
  return document.querySelector(`#comparison-${side}-${suffix}`);
}

function moveComparison(action) {
  stopTimer();
  clearSharedUrlState();
  comparisonRun = comparisonReducer(comparisonRun, action);
  renderComparison();
}

function startComparisonPlayback() {
  clearSharedUrlState();
  comparisonRun = comparisonReducer(comparisonRun, { type: "PLAY" });
  restartComparisonTimer();
  renderComparison();
}

function pauseComparisonPlayback() {
  stopTimer();
  comparisonRun = comparisonReducer(comparisonRun, { type: "PAUSE" });
  renderComparison();
}

function restartComparisonTimer() {
  stopTimer();
  if (comparisonRun.status !== "playing") return;
  playbackClock.start(() => {
    comparisonRun = comparisonReducer(comparisonRun, { type: "TICK" });
    if (comparisonRun.status !== "playing") stopTimer();
    renderComparison();
  }, comparisonRun.speed);
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

function renderChallenge() {
  const enabled = challengePreferences.enabled;
  elements.challengeToggle.setAttribute("aria-pressed", String(enabled));
  elements.challengeToggleStatus.textContent = enabled ? "On" : "Off";
  elements.challengeCard.hidden = !enabled;
  if (!enabled) return;

  const summary = challengeSummary(challenge);
  const best = challengePreferences.bestByLesson[lesson.id];
  elements.challengeScore.textContent = `${summary.correct} / ${summary.answered + summary.skipped}`;
  elements.challengeStreak.textContent = String(challenge.streak);
  elements.challengeBest.textContent = best ? `${best.correct} / ${best.total}` : "—";
  elements.challengeError.textContent = "";

  if (player.index === player.trace.length - 1) {
    elements.challengeProgress.textContent = "ROUND COMPLETE";
    elements.challengeTitle.textContent = summary.complete ? "Challenge complete." : "Lesson complete.";
    elements.challengePrompt.textContent = summary.complete
      ? `${summary.correct} of ${summary.total} transitions correct · ${summary.accuracy}% of answered predictions · best streak ${summary.bestStreak}.`
      : `${summary.correct} correct and ${summary.skipped} skipped. Replay to challenge every transition.`;
    elements.challengeForm.hidden = true;
    elements.challengeFeedback.hidden = true;
    return;
  }

  const question = currentChallengeQuestion();
  const outcome = challenge.answers[question.targetIndex] ?? null;
  elements.challengeProgress.textContent = `${question.number} OF ${question.total}`;
  elements.challengeTitle.textContent = "What happens on the next state change?";
  elements.challengePrompt.textContent = question.prompt;
  elements.challengeForm.hidden = outcome !== null;
  elements.challengeFeedback.hidden = outcome === null;

  if (!outcome) {
    renderChallengeOptions(question);
    return;
  }

  elements.challengeFeedback.dataset.result = outcome.skipped
    ? "skipped"
    : outcome.correct ? "correct" : "incorrect";
  elements.challengeFeedbackLabel.textContent = outcome.skipped
    ? "ANSWER REVEALED"
    : outcome.correct ? "CORRECT" : "NOT THIS TIME";
  elements.challengeFeedbackTitle.textContent = outcome.skipped
    ? "Study the transition, then reveal the state."
    : outcome.correct ? "Your mental model matched the trace." : "Use the difference to update your model.";
  elements.challengeFeedbackCopy.textContent = question.answerText;
}

function renderChallengeOptions(question) {
  const legend = document.createElement("legend");
  legend.className = "sr-only";
  legend.textContent = "Choose the next algorithm outcome";
  const options = question.options.map((option) => {
    const label = document.createElement("label");
    label.className = "challenge-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "challenge-outcome";
    input.value = option.id;
    const text = document.createElement("span");
    text.textContent = option.text;
    label.append(input, text);
    return label;
  });
  elements.challengeOptions.replaceChildren(legend, ...options);
}

function currentChallengeQuestion() {
  return buildChallengeQuestion(lesson.id, player.trace, player.index);
}

function currentChallengeAnswer() {
  if (!challengePreferences.enabled || player.index >= player.trace.length - 1) return null;
  return challenge.answers[player.index + 1] ?? null;
}

function getNextLesson() {
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  return lessons[currentIndex + 1] ?? null;
}

function renderPip(step) {
  const challengeAnswer = currentChallengeAnswer();
  const emotion = pipEmotionForLearning({
    status: player.status,
    stepIndex: player.index,
    predictionLocked: prediction.locked,
    cue: challengeAnswer
      ? challengeAnswer.skipped ? "thinking" : challengeAnswer.correct ? "cool" : "caution"
      : step.pipCue,
    hasError: Boolean(player.error)
  });
  setPipState(elements.pipAvatar, emotion);
  elements.pipEmotionLabel.textContent = pipEmotionLabel(emotion);
  elements.pipEmotionLabel.dataset.emotion = emotion;
  elements.pipSenseiLine.textContent = pipSenseiLine(emotion, lesson.patterns[0]);
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
  const available = !challengePreferences.enabled && (player.index === 0 || prediction.locked);
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
  clearSharedUrlState();
  if (comparisonRun) {
    stopTimer();
    comparisonRun = null;
    elements.comparisonWorkspace.hidden = true;
    elements.lessonGrid.hidden = false;
    elements.reflection.hidden = false;
    elements.challengeToggle.hidden = false;
  }
  if (id !== lesson.id) {
    stopTimer();
    lesson = getLesson(id);
    selectedMapLessonId = id;
    const restored = restoreLessonState(lesson);
    player = playerReducer(player, {
      type: "LOAD_LESSON",
      lessonId: lesson.id,
      trace: restored.trace,
      input: restored.input
    });
    if (restored.stepIndex > 0) {
      player = playerReducer(player, { type: "STEP", index: restored.stepIndex });
    }
    if (challengePreferences.enabled) player = playerReducer(player, { type: "RESET" });
    challenge = createChallengeSession(lesson.id, player.trace);
    resetPrediction();
    replaceLessonUrl(lesson.id);
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
  clearSharedUrlState();
  try {
    const input = lesson.input.parse(collectFields());
    const trace = buildValidatedTrace(lesson, input);
    player = playerReducer(player, { type: "LOAD_INPUT", trace, input });
    challenge = createChallengeSession(lesson.id, trace);
    resetPrediction();
    renderFields();
  } catch (error) {
    player = playerReducer(player, { type: "VALIDATION_ERROR", message: error.message });
  }
  render();
}

function loadSample() {
  stopTimer();
  clearSharedUrlState();
  const input = structuredClone(lesson.input.sampleValue);
  const trace = buildValidatedTrace(lesson, input);
  player = playerReducer(player, { type: "LOAD_INPUT", trace, input });
  challenge = createChallengeSession(lesson.id, trace);
  resetPrediction();
  renderFields();
  render();
}

function startPlayback() {
  if (challengePreferences.enabled) return;
  clearSharedUrlState();
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
  stopTimer();
  if (player.status !== "playing") {
    return;
  }
  playbackClock.start(() => {
    player = playerReducer(player, { type: "TICK" });
    if (player.status !== "playing") {
      stopTimer();
    }
    render();
  }, player.speed);
}

function stopTimer() {
  playbackClock.stop();
}

function move(action) {
  stopTimer();
  if (challengePreferences.enabled && action.type === "NEXT" && currentChallengeAnswer() === null) {
    elements.challengeOptions.querySelector("input")?.focus();
    return;
  }
  clearSharedUrlState();
  player = playerReducer(player, action);
  if (action.type === "RESET") challenge = createChallengeSession(lesson.id, player.trace);
  finalizeChallenge();
  render();
}

function finalizeChallenge() {
  const summary = challengeSummary(challenge);
  if (!challengePreferences.enabled || player.status !== "complete" || !summary.complete) return;
  challengePreferences = recordChallengeBest(challengePreferences, lesson.id, {
    ...summary,
    completedAt: new Date().toISOString()
  }, lessons);
  challengePreferences = writeChallengePreferences(progressStorage, challengePreferences, lessons);
}

function createRestoredPlayer(currentLesson) {
  return restoreLessonPlayer(currentLesson, progress);
}

function restoreSharedLessonPlayer(currentLesson, state) {
  return restoreSharedSessionPlayer(currentLesson, state, progress);
}

function restoreLessonState(currentLesson) {
  return restoreSessionState(currentLesson, progress);
}

function persistCurrentProgress() {
  progress = persistLessonSession({ progress, lesson, player, lessons, storage: progressStorage });
}

function replaceLessonUrl(lessonId) {
  const nextUrl = removeShareStateFromUrl(window.location.href);
  nextUrl.hash = lessonHash(lessonId);
  window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

function clearSharedUrlState() {
  shareController.clearUrlState();
}

function currentShareSnapshot() {
  if (comparisonRun) {
    return {
      title: `${comparisonFamily.label} comparison`,
      state: createComparisonShareState({
        familyId: comparisonFamily.id,
        leftLessonId: comparisonRun.left.lessonId,
        rightLessonId: comparisonRun.right.lessonId,
        fields: comparisonFamily.input.serialize(comparisonRun.input),
        leftIndex: comparisonRun.left.index,
        rightIndex: comparisonRun.right.index
      })
    };
  }
  return {
    title: lesson.catalogLabel,
    state: createLessonShareState({
      lessonId: lesson.id,
      fields: lesson.input.serialize(player.input),
      stepIndex: player.index
    })
  };
}

function renderShareRestoreNotice() {
  shareController.renderRestoreNotice(shareRestoreError);
}

elements.apply.addEventListener("click", applyCurrentInput);
elements.shareStateButton.addEventListener("click", shareController.shareCurrentState);
elements.dismissShareStateNotice.addEventListener("click", () => {
  shareRestoreError = null;
  elements.shareStateNotice.hidden = true;
  clearSharedUrlState();
});
elements.sample.addEventListener("click", loadSample);
elements.openComparison.addEventListener("click", () => openComparison("sorting-strategies"));
elements.comparisonLaunch.addEventListener("click", () => openComparison(null, lesson.id));
elements.comparisonExit.addEventListener("click", closeComparison);
elements.comparisonFamily.addEventListener("change", () => openComparison(elements.comparisonFamily.value));
elements.comparisonLeft.addEventListener("change", () => rebuildComparison());
elements.comparisonRight.addEventListener("change", () => rebuildComparison());
elements.comparisonForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    rebuildComparison(comparisonFamily.input.parse(collectComparisonFields()));
  } catch (error) {
    elements.comparisonError.textContent = error.message;
    elements.comparisonFields.querySelector("input")?.focus();
  }
});
elements.comparisonSample.addEventListener("click", () => {
  rebuildComparison(structuredClone(comparisonFamily.input.sampleValue));
});
elements.comparisonPrevious.addEventListener("click", () => moveComparison({ type: "PREVIOUS" }));
elements.comparisonNext.addEventListener("click", () => moveComparison({ type: "NEXT" }));
elements.comparisonReset.addEventListener("click", () => moveComparison({ type: "RESET" }));
elements.comparisonPlay.addEventListener("click", () => {
  if (comparisonRun.status === "playing") pauseComparisonPlayback();
  else startComparisonPlayback();
});
elements.comparisonSpeed.addEventListener("input", () => {
  const wasPlaying = comparisonRun.status === "playing";
  comparisonRun = comparisonReducer(comparisonRun, {
    type: "SET_SPEED",
    speed: controlValueToPlaybackDelay(Number(elements.comparisonSpeed.value))
  });
  if (wasPlaying) restartComparisonTimer();
  renderComparison();
});
elements.comparisonWorkspace.addEventListener("click", (event) => {
  const button = event.target.closest("[data-comparison-action]");
  if (!button) return;
  const state = comparisonRun[button.dataset.side];
  const direction = button.dataset.comparisonAction === "next" ? 1 : -1;
  moveComparison({
    type: "STEP_SIDE",
    side: button.dataset.side,
    index: state.index + direction
  });
});
elements.catalogSearch.addEventListener("input", updateCatalogFilters);
elements.catalogListView.addEventListener("click", () => setCatalogView("list"));
elements.catalogMapView.addEventListener("click", () => setCatalogView("map"));
elements.curriculumMapPattern.addEventListener("change", () => {
  selectedMapPattern = elements.curriculumMapPattern.value;
  renderCurriculumMapSelection();
});
elements.catalogTopicFilter.addEventListener("change", updateCatalogFilters);
elements.catalogPatternFilter.addEventListener("change", updateCatalogFilters);
elements.catalogProgressFilter.addEventListener("change", updateCatalogFilters);
elements.clearCatalogFilters.addEventListener("click", clearCatalogFilters);
elements.catalogEmptyClear.addEventListener("click", clearCatalogFilters);
elements.challengeToggle.addEventListener("click", () => {
  clearSharedUrlState();
  stopTimer();
  const enabled = !challengePreferences.enabled;
  challengePreferences = setChallengePreference(challengePreferences, enabled, lessons);
  challengePreferences = writeChallengePreferences(progressStorage, challengePreferences, lessons);
  player = playerReducer(player, { type: "RESET" });
  challenge = createChallengeSession(lesson.id, player.trace);
  resetPrediction();
  render();
  elements.live.textContent = enabled
    ? "Challenge Mode on. The lesson restarted so you can predict every state transition."
    : "Challenge Mode off. Guided playback is available again.";
  if (enabled) elements.challengeOptions.querySelector("input")?.focus();
});
elements.challengeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = currentChallengeQuestion();
  const selected = elements.challengeOptions.querySelector('input[name="challenge-outcome"]:checked');
  if (!selected) {
    elements.challengeError.textContent = "Choose an outcome before checking your answer.";
    elements.challengeOptions.querySelector("input")?.focus();
    return;
  }
  challenge = answerChallenge(challenge, question, selected.value);
  render();
  elements.next.focus({ preventScroll: true });
});
elements.challengeSkip.addEventListener("click", () => {
  challenge = skipChallenge(challenge, currentChallengeQuestion());
  render();
  elements.next.focus({ preventScroll: true });
});
elements.continueLearning.addEventListener("click", () => {
  if (progress.lastLessonId) loadLesson(progress.lastLessonId);
});
elements.resetProgress.addEventListener("click", () => {
  elements.resetProgressConfirmation.hidden = false;
  elements.cancelResetProgress.focus();
});
elements.cancelResetProgress.addEventListener("click", () => {
  elements.resetProgressConfirmation.hidden = true;
  elements.resetProgress.focus();
});
elements.confirmResetProgress.addEventListener("click", () => {
  stopTimer();
  progress = clearLearningProgress(progressStorage);
  player = playerReducer(player, { type: "RESET" });
  challenge = createChallengeSession(lesson.id, player.trace);
  resetPrediction();
  elements.resetProgressConfirmation.hidden = true;
  render();
  elements.resetProgress.focus();
  elements.live.textContent = "Learning progress was reset on this device.";
});
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
  if (challengePreferences.enabled) {
    move({ type: "RESET" });
    elements.challengeOptions.querySelector("input")?.focus();
  } else {
    startPlayback();
    elements.play.focus({ preventScroll: true });
  }
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
  if (comparisonRun) {
    if (event.key === "ArrowRight") moveComparison({ type: "NEXT" });
    if (event.key === "ArrowLeft") moveComparison({ type: "PREVIOUS" });
    if (event.key === " ") {
      event.preventDefault();
      comparisonRun.status === "playing" ? pauseComparisonPlayback() : startComparisonPlayback();
    }
    if (event.key.toLowerCase() === "r") moveComparison({ type: "RESET" });
    return;
  }
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
window.addEventListener("resize", () => requestAnimationFrame(renderCurriculumMapEdges));

mountPips();
observePipVisibility();
initializeCatalog();
initializeComparisonMode();
renderLessonChrome();
if (initialShared.state?.kind === "comparison") {
  shareRestoreError = restoreSharedComparison(initialShared.state) ?? shareRestoreError;
  if (!comparisonRun) render();
} else {
  render();
}
renderShareRestoreNotice();
if (initialShared.state && !shareRestoreError) {
  elements.shareStateStatus.textContent = initialShared.state.kind === "comparison"
    ? "Shared comparison restored."
    : "Shared input and step restored.";
}
if (initialLessonIdFromHash || initialSharedLessonId) {
  window.requestAnimationFrame(enterLesson);
} else if (!comparisonRun && !initialShared.error) {
  replaceLessonUrl(lesson.id);
}
