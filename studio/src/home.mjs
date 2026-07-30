import { mountPips, observePipVisibility, setPipState } from "./pip.mjs";

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
  const cells = [...root.querySelectorAll("[data-scan-cell]")];
  const current = root.querySelector("[data-scan-current]");
  const best = root.querySelector("[data-scan-best]");
  const decision = root.querySelector("[data-scan-decision]");
  const status = root.querySelector("[data-scan-status]");
  let index = 0;
  let bestIndex = 0;
  let timer = null;
  let complete = false;

  function render() {
    if (index === 0) bestIndex = 0;
    const previousBest = values[bestIndex];
    if (values[index] > values[bestIndex]) bestIndex = index;
    cells.forEach((cell, cellIndex) => {
      cell.classList.toggle("is-current", cellIndex === index);
      cell.classList.toggle("is-best", cellIndex === bestIndex);
      const label = cell.querySelector("i");
      label.textContent = cellIndex === index && cellIndex === bestIndex
        ? "current · best"
        : cellIndex === index
          ? "current"
          : cellIndex === bestIndex
            ? "best"
            : "";
    });
    current.textContent = values[index];
    best.textContent = values[bestIndex];
    const changed = values[index] > previousBest;
    decision.textContent = index === 0 ? "Start here" : changed ? "Update best" : "Keep best";
    status.textContent = index === 0
      ? `Start with ${values[index]} as the best`
      : `${values[index]} ${changed ? "beats" : "does not beat"} ${previousBest}`;
  }

  function next() {
    if (index >= values.length - 1) {
      complete = true;
      stop();
      return;
    }
    index += 1;
    render();
    if (index === values.length - 1) {
      complete = true;
      stop();
    }
  }

  function reset() {
    index = 0;
    bestIndex = 0;
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
    index = 2;
    bestIndex = 0;
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
  const cells = [...root.querySelectorAll("[data-window-cell]")];
  const leaves = root.querySelector("[data-window-leaves]");
  const enters = root.querySelector("[data-window-enters]");
  const sum = root.querySelector("[data-window-sum]");
  const status = root.querySelector("[data-window-status]");
  const size = 3;
  const lastStart = values.length - size;
  let start = 0;
  let timer = null;
  let complete = false;

  function render() {
    const end = start + size - 1;
    cells.forEach((cell, index) => {
      cell.classList.toggle("is-window", index >= start && index <= end);
      cell.classList.toggle("is-leaving", start > 0 && index === start - 1);
      cell.classList.toggle("is-entering", start > 0 && index === end);
      const label = cell.querySelector("i");
      label.textContent = start > 0 && index === start - 1
        ? "leaves"
        : start > 0 && index === end
          ? "enters"
          : index === start
            ? "window"
            : "";
    });
    const runningSum = values.slice(start, end + 1).reduce((total, value) => total + value, 0);
    leaves.textContent = start === 0 ? "—" : values[start - 1];
    enters.textContent = start === 0 ? "—" : values[end];
    sum.textContent = runningSum;
    status.textContent = `Window ${start}–${end}`;
  }

  function next() {
    if (start >= lastStart) {
      complete = true;
      stop();
      return;
    }
    start += 1;
    render();
    if (start === lastStart) {
      complete = true;
      stop();
    }
  }

  function reset() {
    start = 0;
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
    start = lastStart;
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
