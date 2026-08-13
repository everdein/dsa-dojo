export async function hydrateLessonSource(lesson, fetcher = globalThis.fetch) {
  if (typeof fetcher !== "function") throw new TypeError("Source panes require a fetch implementation.");
  const response = await fetcher(sourceModuleUrl(lesson.code.sourcePath));
  if (!response?.ok) throw new Error(`Could not load lesson source: ${lesson.code.sourcePath}`);
  const source = await response.text();
  return {
    ...lesson,
    code: {
      ...lesson.code,
      lines: deriveSourceLines(source, lesson.code.lines)
    }
  };
}

export function sourceModuleUrl(sourcePath, moduleUrl = import.meta.url) {
  if (!/^(?:[a-z0-9][a-z0-9-]*\/)+[a-z0-9][a-z0-9-]*\.mjs$/u.test(sourcePath)) {
    throw new Error(`Unsafe lesson source path: ${sourcePath}`);
  }
  return new URL(`../../${sourcePath}`, moduleUrl);
}

export function deriveSourceLines(source, declaredLines) {
  if (typeof source !== "string" || !Array.isArray(declaredLines) || declaredLines.length === 0) {
    throw new TypeError("Source derivation requires source text and declared code lines.");
  }
  const sourceLines = source.split(/\r?\n/u);
  const candidates = declaredLines.map((line) => sourceLines
    .map((text, index) => text === line.text ? index : -1)
    .filter((index) => index >= 0));
  if (candidates.some((matches) => matches.length === 0)) {
    const missing = declaredLines[candidates.findIndex((matches) => matches.length === 0)];
    throw new Error(`Source anchor is missing from its module: ${missing.text}`);
  }

  const resolved = chooseNearestCandidates(candidates, declaredLines.map(({ number }) => number - 1));
  return declaredLines.map((line, index) => ({
    ...line,
    number: resolved[index] + 1,
    text: sourceLines[resolved[index]]
  }));
}

function chooseNearestCandidates(candidates, preferred) {
  const used = new Set();
  return candidates.map((matches, index) => {
    const available = matches.filter((candidate) => !used.has(candidate));
    const pool = available.length > 0 ? available : matches;
    const selected = [...pool].sort((left, right) => (
      Math.abs(left - preferred[index]) - Math.abs(right - preferred[index])
    ))[0];
    used.add(selected);
    return selected;
  });
}
