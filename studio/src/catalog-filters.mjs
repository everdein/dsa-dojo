export const catalogProgressFilters = Object.freeze(["all", "not-started", "started", "complete"]);

export function createCatalogFilterState(overrides = {}) {
  return {
    query: normalizeText(overrides.query),
    topic: normalizeToken(overrides.topic, "all"),
    pattern: normalizeToken(overrides.pattern, "all"),
    progress: catalogProgressFilters.includes(overrides.progress) ? overrides.progress : "all"
  };
}

export function filterCatalogLessons(lessons, state, progressStateForLesson = () => "not-started") {
  if (!Array.isArray(lessons)) throw new TypeError("Catalog filtering requires a lesson array.");
  const filters = createCatalogFilterState(state);
  const query = filters.query.toLocaleLowerCase("en-US");

  return lessons.filter((lesson) => {
    if (filters.topic !== "all" && lesson.topic !== filters.topic) return false;
    if (filters.pattern !== "all" && !lesson.patterns.includes(filters.pattern)) return false;
    const progress = progressStateForLesson(lesson.id);
    if (filters.progress === "complete" && progress !== "complete") return false;
    if (filters.progress === "not-started" && progress !== "not-started") return false;
    if (filters.progress === "started" && !["visited", "in-progress"].includes(progress)) return false;
    if (!query) return true;
    return lessonSearchText(lesson).includes(query);
  });
}

export function catalogFilterOptions(lessons) {
  if (!Array.isArray(lessons)) throw new TypeError("Catalog options require a lesson array.");
  return {
    topics: [...new Set(lessons.map(({ topic }) => topic))],
    patterns: [...new Set(lessons.flatMap(({ patterns = [] }) => patterns))]
      .sort((left, right) => left.localeCompare(right))
  };
}

export function catalogFilterStateFromUrl(url) {
  const parsed = url instanceof URL ? url : new URL(String(url), "https://dsa-dojo.local/");
  return createCatalogFilterState({
    query: parsed.searchParams.get("q"),
    topic: parsed.searchParams.get("topic"),
    pattern: parsed.searchParams.get("pattern"),
    progress: parsed.searchParams.get("progress")
  });
}

export function catalogFilterUrl(url, state) {
  const parsed = url instanceof URL ? new URL(url.href) : new URL(String(url), "https://dsa-dojo.local/");
  const filters = createCatalogFilterState(state);
  setOptionalParameter(parsed.searchParams, "q", filters.query, "");
  setOptionalParameter(parsed.searchParams, "topic", filters.topic, "all");
  setOptionalParameter(parsed.searchParams, "pattern", filters.pattern, "all");
  setOptionalParameter(parsed.searchParams, "progress", filters.progress, "all");
  return parsed;
}

export function hasActiveCatalogFilters(state) {
  const filters = createCatalogFilterState(state);
  return Boolean(filters.query) || filters.topic !== "all" || filters.pattern !== "all" || filters.progress !== "all";
}

function lessonSearchText(lesson) {
  return [
    lesson.id,
    `l${String(lesson.order).padStart(2, "0")}`,
    lesson.topic,
    lesson.catalogLabel,
    lesson.catalogDescription,
    ...(lesson.patterns ?? [])
  ].join(" ").replaceAll("-", " ").toLocaleLowerCase("en-US");
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

function normalizeToken(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function setOptionalParameter(parameters, key, value, defaultValue) {
  if (value === defaultValue) parameters.delete(key);
  else parameters.set(key, value);
}
