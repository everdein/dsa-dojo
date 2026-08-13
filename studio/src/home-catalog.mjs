import { learningProgressSummary, lessonProgressState } from "./learning-progress.mjs";

export function groupCurriculumByTopic(lessons) {
  if (!Array.isArray(lessons)) {
    throw new TypeError("Curriculum lessons must be an array.");
  }

  const groups = [];
  const groupsByTopic = new Map();
  for (const lesson of lessons) {
    if (!lesson || typeof lesson.topic !== "string" || lesson.topic.trim() === "") {
      throw new TypeError("Every curriculum lesson requires a topic.");
    }

    let group = groupsByTopic.get(lesson.topic);
    if (!group) {
      group = { topic: lesson.topic, lessons: [] };
      groupsByTopic.set(lesson.topic, group);
      groups.push(group);
    }
    group.lessons.push(lesson);
  }

  return groups;
}

export function curriculumTopicId(topic) {
  if (typeof topic !== "string" || topic.trim() === "") {
    throw new TypeError("Curriculum topic ids require a topic.");
  }
  const slug = topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `curriculum-topic-${slug || "topic"}`;
}

export function renderCurriculumCatalog(documentRoot, lessons, progress = null) {
  const container = documentRoot.querySelector("#home-lessons");
  const navigation = documentRoot.querySelector("#home-topic-nav");
  const count = documentRoot.querySelector("#home-curriculum-count");
  const summary = documentRoot.querySelector("#home-curriculum-summary");
  if (!container || !navigation || !count || !summary) return [];

  const groups = groupCurriculumByTopic(lessons);
  const progressSummary = learningProgressSummary(progress, lessons);
  count.textContent = `CURRICULUM · ${groups.length} ${groups.length === 1 ? "TOPIC" : "TOPICS"}`;
  summary.textContent = `${lessons.length} focused lessons grouped by topic. Lesson numbers preserve the recommended L01-L${String(lessons.length).padStart(2, "0")} path.`;
  renderHomeProgress(documentRoot, lessons, progressSummary);

  const navigationList = documentRoot.createElement("ul");
  for (const [groupIndex, group] of groups.entries()) {
    const topicId = curriculumTopicId(group.topic);
    const navigationItem = documentRoot.createElement("li");
    const navigationLink = documentRoot.createElement("a");
    navigationItem.dataset.topic = group.topic;
    navigationLink.href = `#${topicId}`;
    navigationLink.setAttribute(
      "aria-label",
      `${group.topic}, ${group.lessons.length} ${group.lessons.length === 1 ? "lesson" : "lessons"}`
    );
    const topicName = documentRoot.createElement("span");
    topicName.textContent = group.topic;
    const topicCount = documentRoot.createElement("small");
    topicCount.setAttribute("aria-hidden", "true");
    topicCount.textContent = String(group.lessons.length);
    navigationLink.append(topicName, topicCount);
    navigationItem.append(navigationLink);
    navigationList.append(navigationItem);
  }
  navigation.replaceChildren(navigationList);

  const sections = groups.map((group, groupIndex) => createTopicSection(
    documentRoot,
    group,
    groupIndex,
    groups.length,
    progress
  ));
  container.replaceChildren(...sections);
  return groups;
}

function createTopicSection(documentRoot, group, groupIndex, groupCount, progress) {
  const topicId = curriculumTopicId(group.topic);
  const headingId = `${topicId}-title`;
  const section = documentRoot.createElement("section");
  section.className = "home-lesson-topic";
  section.dataset.topic = group.topic;
  section.id = topicId;
  section.setAttribute("aria-labelledby", headingId);
  section.tabIndex = -1;

  const heading = documentRoot.createElement("div");
  heading.className = "home-lesson-topic-heading";
  const headingCopy = documentRoot.createElement("div");
  const eyebrow = documentRoot.createElement("p");
  eyebrow.className = "home-lesson-group";
  eyebrow.textContent = `TOPIC ${String(groupIndex + 1).padStart(2, "0")} OF ${String(groupCount).padStart(2, "0")}`;
  const title = documentRoot.createElement("h3");
  title.id = headingId;
  title.textContent = group.topic;
  headingCopy.append(eyebrow, title);

  const headingActions = documentRoot.createElement("div");
  headingActions.className = "home-lesson-topic-actions";
  const lessonCount = documentRoot.createElement("span");
  const completed = group.lessons.filter(({ id }) => lessonProgressState(progress, id).status === "complete").length;
  lessonCount.textContent = `${completed} of ${group.lessons.length} complete`;
  const backLink = documentRoot.createElement("a");
  backLink.href = "#home-topic-nav";
  backLink.textContent = "Back to topics ↑";
  backLink.setAttribute("aria-label", `Back to curriculum topics from ${group.topic}`);
  headingActions.append(lessonCount, backLink);
  heading.append(headingCopy, headingActions);

  const lessonList = documentRoot.createElement("ul");
  lessonList.className = "home-topic-lessons";
  lessonList.setAttribute("aria-label", `${group.topic} lessons`);
  for (const lesson of group.lessons) {
    const item = documentRoot.createElement("li");
    item.dataset.reveal = "";
    item.append(createLessonCard(documentRoot, lesson, progress));
    lessonList.append(item);
  }

  section.append(heading, lessonList);
  return section;
}

function createLessonCard(documentRoot, lesson, progress) {
  const card = documentRoot.createElement("a");
  card.className = "home-lesson-card";
  card.dataset.lessonId = lesson.id;
  card.href = `./studio/#lesson=${encodeURIComponent(lesson.id)}`;

  const index = documentRoot.createElement("span");
  index.className = "lesson-index";
  index.textContent = `L${String(lesson.order).padStart(2, "0")}`;

  const copy = documentRoot.createElement("span");
  copy.className = "lesson-card-copy";
  const pattern = documentRoot.createElement("small");
  pattern.textContent = (lesson.patterns[0] ?? lesson.topic).replaceAll("-", " ");
  const title = documentRoot.createElement("strong");
  title.textContent = lesson.catalogLabel;
  const description = documentRoot.createElement("span");
  description.textContent = lesson.catalogDescription;
  const state = lessonProgressState(progress, lesson.id);
  const progressLabel = documentRoot.createElement("span");
  progressLabel.className = "home-lesson-progress";
  progressLabel.textContent = state.status === "complete" ? "✓ Complete" : state.label;
  card.dataset.progress = state.status;
  copy.append(pattern, title, description, progressLabel);

  const arrow = documentRoot.createElement("span");
  arrow.className = "lesson-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  card.append(index, copy, arrow);
  return card;
}

function renderHomeProgress(documentRoot, lessons, summary) {
  const panel = documentRoot.querySelector("#home-progress");
  const text = documentRoot.querySelector("#home-progress-summary");
  const meter = documentRoot.querySelector("#home-progress-meter");
  const fill = documentRoot.querySelector("#home-progress-meter-fill");
  const continueLink = documentRoot.querySelector("#home-progress-continue");
  if (!panel || !text || !meter || !fill || !continueLink) return;

  panel.hidden = false;
  text.textContent = `${summary.completed} of ${summary.total} lessons complete · ${summary.percent}%`;
  meter.setAttribute("aria-valuemax", String(summary.total));
  meter.setAttribute("aria-valuenow", String(summary.completed));
  fill.style.width = `${summary.percent}%`;
  const lastLesson = lessons.find(({ id }) => id === summary.lastLessonId) ?? null;
  continueLink.hidden = lastLesson === null;
  if (lastLesson) {
    continueLink.href = `./studio/#lesson=${encodeURIComponent(lastLesson.id)}`;
    continueLink.textContent = `Continue ${lastLesson.catalogLabel} →`;
  }
}
