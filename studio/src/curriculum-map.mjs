/**
 * Pure curriculum graph projection. The browser renderer consumes this model,
 * while tests can verify every relationship without constructing lesson traces.
 */
export function buildCurriculumMap(lessons) {
  if (!Array.isArray(lessons) || lessons.length === 0) {
    throw new TypeError("Curriculum map requires a non-empty lesson array.");
  }

  const byId = new Map();
  for (const lesson of lessons) {
    assertMapLesson(lesson);
    if (byId.has(lesson.id)) throw new Error(`Duplicate curriculum lesson: ${lesson.id}`);
    byId.set(lesson.id, lesson);
  }

  const dependentIds = new Map(lessons.map(({ id }) => [id, []]));
  const depths = new Map();
  const visiting = new Set();

  function depthFor(id) {
    if (depths.has(id)) return depths.get(id);
    if (visiting.has(id)) throw new Error(`Curriculum prerequisites contain a cycle at ${id}.`);
    visiting.add(id);
    const lesson = byId.get(id);
    const prerequisites = lesson.prerequisites.map((prerequisiteId) => {
      if (!byId.has(prerequisiteId)) {
        throw new Error(`${id} references missing prerequisite ${prerequisiteId}.`);
      }
      dependentIds.get(prerequisiteId).push(id);
      return depthFor(prerequisiteId);
    });
    visiting.delete(id);
    const depth = prerequisites.length === 0 ? 0 : Math.max(...prerequisites) + 1;
    depths.set(id, depth);
    return depth;
  }

  lessons.forEach(({ id }) => depthFor(id));
  const topicOrder = [...new Set(lessons.map(({ topic }) => topic))];
  const nodes = lessons.map((lesson) => Object.freeze({
    id: lesson.id,
    order: lesson.order,
    topic: lesson.topic,
    topicIndex: topicOrder.indexOf(lesson.topic),
    label: lesson.catalogLabel,
    description: lesson.catalogDescription,
    depth: depths.get(lesson.id),
    prerequisites: Object.freeze([...lesson.prerequisites]),
    dependents: Object.freeze([...dependentIds.get(lesson.id)]),
    patterns: Object.freeze([...lesson.patterns])
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const maximumDepth = Math.max(...nodes.map(({ depth }) => depth));
  const columns = Array.from({ length: maximumDepth + 1 }, (_, depth) => Object.freeze(
    nodes.filter((node) => node.depth === depth)
  ));
  const edges = nodes.flatMap((node) => node.prerequisites.map((source) => Object.freeze({
    source,
    target: node.id,
    id: `${source}->${node.id}`
  })));
  const patternCounts = new Map();
  for (const node of nodes) {
    for (const pattern of node.patterns) patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
  }
  const patterns = [...patternCounts]
    .map(([id, count]) => Object.freeze({ id, count }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return Object.freeze({
    nodes: Object.freeze(nodes),
    nodeById,
    columns: Object.freeze(columns),
    edges: Object.freeze(edges),
    patterns: Object.freeze(patterns),
    topics: Object.freeze(topicOrder),
    maximumDepth
  });
}

export function curriculumMapSelection(map, lessonId, pattern = "all") {
  if (!map?.nodeById?.has(lessonId)) throw new Error(`Unknown curriculum map lesson: ${lessonId}`);
  const node = map.nodeById.get(lessonId);
  const matchingPatternIds = pattern === "all"
    ? map.nodes.map(({ id }) => id)
    : map.nodes.filter(({ patterns }) => patterns.includes(pattern)).map(({ id }) => id);
  return Object.freeze({
    lessonId,
    pattern,
    prerequisiteIds: Object.freeze([...node.prerequisites]),
    dependentIds: Object.freeze([...node.dependents]),
    matchingPatternIds: Object.freeze(matchingPatternIds),
    activeEdgeIds: Object.freeze(map.edges
      .filter(({ source, target }) => source === lessonId || target === lessonId)
      .map(({ id }) => id))
  });
}

function assertMapLesson(lesson) {
  if (!lesson || typeof lesson !== "object") throw new TypeError("Each map lesson must be an object.");
  if (typeof lesson.id !== "string" || !lesson.id) throw new TypeError("Each map lesson needs an id.");
  if (!Number.isInteger(lesson.order) || lesson.order < 1) throw new TypeError(`${lesson.id} needs a positive order.`);
  if (typeof lesson.topic !== "string" || !lesson.topic) throw new TypeError(`${lesson.id} needs a topic.`);
  if (typeof lesson.catalogLabel !== "string" || !lesson.catalogLabel) throw new TypeError(`${lesson.id} needs a label.`);
  if (typeof lesson.catalogDescription !== "string" || !lesson.catalogDescription) throw new TypeError(`${lesson.id} needs a description.`);
  if (!Array.isArray(lesson.prerequisites) || !Array.isArray(lesson.patterns)) {
    throw new TypeError(`${lesson.id} needs prerequisite and pattern arrays.`);
  }
}
