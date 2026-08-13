import { mountPips, observePipVisibility, setPipState } from "./pip.mjs";
import { buildFindLargestTrace } from "./find-largest.mjs";
import { buildSlidingWindowTrace } from "./sliding-window.mjs";
import { curriculumLessons } from "./curriculum-manifest.mjs";
import { renderCurriculumCatalog } from "./home-catalog.mjs";
import { readLearningProgress } from "./learning-progress.mjs";

renderCurriculumCatalog(document, curriculumLessons, readLearningProgress(getBrowserStorage(), curriculumLessons));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const header = document.querySelector("[data-home-header]");
const storyPip = document.querySelector("[data-story-pip]");
const storyLabel = document.querySelector("[data-story-label]");
const storyMessage = document.querySelector("[data-story-message]");
const storyProgress = document.querySelector("[data-story-progress]");
const storyChapters = [...document.querySelectorAll("[data-story-chapter]")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];

mountPips();
observePipVisibility();

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const chapterVisibility = new Map(storyChapters.map((chapter) => [chapter, 0]));
const storyObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        chapterVisibility.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      const visible = storyChapters
        .map((chapter) => ({
          chapter,
          ratio: chapterVisibility.get(chapter),
          distance: Math.abs(chapter.getBoundingClientRect().top - window.innerHeight * 0.32)
        }))
        .filter((item) => item.ratio > 0)
        .sort((left, right) => right.ratio - left.ratio || left.distance - right.distance)[0];
      if (visible) activateStoryChapter(visible.chapter);
    }, { threshold: [0.25, 0.5, 0.7], rootMargin: "-12% 0px -30% 0px" })
  : null;

storyChapters.forEach((chapter) => storyObserver?.observe(chapter));
activateStoryChapter(storyChapters[0]);

const scanDemo = createScanDemo(document.querySelector("[data-scan-demo]"));
const windowDemo = createWindowDemo(document.querySelector("[data-window-demo]"));
const demoControllers = new Map([
  [document.querySelector("[data-scan-demo]"), scanDemo],
  [document.querySelector("[data-window-demo]"), windowDemo]
]);

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const demoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const controller = demoControllers.get(entry.target);
      if (!controller) continue;
      if (entry.isIntersecting && !document.hidden) controller.start();
      else controller.stop();
    }
  }, { threshold: 0.45 });
  demoControllers.forEach((_, element) => demoObserver.observe(element));
} else {
  scanDemo.showRepresentativeState();
  windowDemo.showRepresentativeState();
}

window.addEventListener("scroll", updateHeader, { passive: true });
document.addEventListener("visibilitychange", () => {
  demoControllers.forEach((controller, element) => {
    if (document.hidden) controller.stop();
    else if (isMostlyVisible(element) && !reducedMotion.matches) controller.start();
  });
});
reducedMotion.addEventListener?.("change", () => window.location.reload());
updateHeader();

function getBrowserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function activateStoryChapter(chapter) {
  if (!chapter) return;
  storyChapters.forEach((item) => item.classList.toggle("is-active", item === chapter));
  setPipState(storyPip, chapter.dataset.pipState);
  storyLabel.textContent = chapter.dataset.pipLabel;
  storyMessage.textContent = chapter.dataset.pipMessage;
  const index = storyChapters.indexOf(chapter);
  storyProgress.style.width = `${((index + 1) / storyChapters.length) * 100}%`;
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function createScanDemo(root) {
  const values = [...root.querySelectorAll("[data-scan-cell]")].map((cell) => Number(cell.dataset.value));
  const trace = buildFindLargestTrace(values);
  const cells = [...root.querySelectorAll("[data-scan-cell]")];
  const current = root.querySelector("[data-scan-current]");
  const best = root.querySelector("[data-scan-best]");
  const decision = root.querySelector("[data-scan-decision]");
  const status = root.querySelector("[data-scan-status]");
  let index = 0;
  let timer = null;
  let complete = false;

  function render() {
    const step = trace[index];
    const activeIndex = step.view.activeIndices[0] ?? null;
    cells.forEach((cell, cellIndex) => {
      cell.classList.toggle("is-current", cellIndex === activeIndex);
      cell.classList.toggle("is-best", cellIndex === step.bestIndex);
      const label = cell.querySelector("i");
      label.textContent = cellIndex === activeIndex && cellIndex === step.bestIndex
        ? "current · best"
        : cellIndex === activeIndex
          ? "current"
          : cellIndex === step.bestIndex
            ? "best"
            : "";
    });
    current.textContent = activeIndex === null ? "—" : values[activeIndex];
    best.textContent = step.bestValue;
    decision.textContent = step.phase === "complete"
      ? "Result locked"
      : step.step === 0
        ? "Start here"
        : step.changed
          ? "Update best"
          : "Keep best";
    status.textContent = step.narration;
  }

  function next() {
    if (index >= trace.length - 1) {
      complete = true;
      stop();
      return;
    }
    index += 1;
    render();
    if (index === trace.length - 1) {
      complete = true;
      stop();
    }
  }

  function reset() {
    index = 0;
    complete = false;
    render();
  }

  function start() {
    if (reducedMotion.matches || timer !== null) return;
    if (complete) reset();
    timer = window.setInterval(next, 1450);
  }

  function stop() {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
  }

  function showRepresentativeState() {
    stop();
    index = trace.findIndex((step) => step.step > 0 && step.changed);
    if (index < 0) index = Math.max(0, trace.length - 2);
    complete = true;
    render();
  }

  function replay() {
    stop();
    if (reducedMotion.matches) {
      showRepresentativeState();
      return;
    }
    reset();
    start();
  }

  root.querySelector("[data-scan-replay]").addEventListener("click", replay);
  render();
  return {
    start,
    stop,
    showRepresentativeState
  };
}

function createWindowDemo(root) {
  const values = [...root.querySelectorAll("[data-window-cell]")].map((cell) => Number(cell.dataset.value));
  const size = 3;
  const trace = buildSlidingWindowTrace({ values, size });
  const cells = [...root.querySelectorAll("[data-window-cell]")];
  const leaves = root.querySelector("[data-window-leaves]");
  const enters = root.querySelector("[data-window-enters]");
  const sum = root.querySelector("[data-window-sum]");
  const status = root.querySelector("[data-window-status]");
  let index = 0;
  let timer = null;
  let complete = false;

  function render() {
    const step = trace[index];
    cells.forEach((cell, cellIndex) => {
      cell.classList.toggle("is-window", cellIndex >= step.currentStart && cellIndex <= step.currentEnd);
      cell.classList.toggle("is-leaving", cellIndex === step.leavingIndex);
      cell.classList.toggle("is-entering", cellIndex === step.enteringIndex);
      const label = cell.querySelector("i");
      label.textContent = cellIndex === step.leavingIndex
        ? "leaves"
        : cellIndex === step.enteringIndex
          ? "enters"
          : cellIndex === step.currentStart
            ? "window"
            : "";
    });
    leaves.textContent = step.leavingIndex === null ? "—" : values[step.leavingIndex];
    enters.textContent = step.enteringIndex === null ? "—" : values[step.enteringIndex];
    sum.textContent = step.currentSum;
    status.textContent = step.phase === "complete"
      ? `Best ${step.bestStart}–${step.bestEnd}`
      : `Window ${step.currentStart}–${step.currentEnd}`;
  }

  function next() {
    if (index >= trace.length - 1) {
      complete = true;
      stop();
      return;
    }
    index += 1;
    render();
    if (index === trace.length - 1) {
      complete = true;
      stop();
    }
  }

  function reset() {
    index = 0;
    complete = false;
    render();
  }

  function startPlayback() {
    if (reducedMotion.matches || timer !== null) return;
    if (complete) reset();
    timer = window.setInterval(next, 1700);
  }

  function stop() {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
  }

  function showRepresentativeState() {
    stop();
    index = trace.findIndex((step) => step.step > 0 && step.changed);
    if (index < 0) index = Math.max(0, trace.length - 2);
    complete = true;
    render();
  }

  function replay() {
    stop();
    if (reducedMotion.matches) {
      showRepresentativeState();
      return;
    }
    reset();
    startPlayback();
  }

  root.querySelector("[data-window-replay]").addEventListener("click", replay);
  render();
  return {
    start: startPlayback,
    stop,
    showRepresentativeState
  };
}

function isMostlyVisible(element) {
  const bounds = element.getBoundingClientRect();
  return bounds.top < window.innerHeight * 0.7 && bounds.bottom > window.innerHeight * 0.3;
}
