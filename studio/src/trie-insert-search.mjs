import {
  normalizeTrieWord,
  searchTrie,
  validateTrieInput
} from "../../tries/trie-insert-search.mjs";

export { searchTrie };

export function buildTrieInsertSearchTrace({ words, query }) {
  validateTrieInput(words, query);
  const root = createTraceNode("node-0", "root", "", null);
  const trace = [];
  let nextNodeId = 1;
  let nextEdgeId = 0;
  let insertedWords = 0;
  let charactersProcessed = 0;
  const visitedSearchIds = new Set();

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    root,
    insertedWords,
    charactersProcessed,
    queryIndex: null,
    found: null,
    isPrefix: null,
    narration: "Start with one root node and no character edges.",
    prompt: "Which shared prefix should reuse the same path?"
  }));

  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const rawWord = words[wordIndex];
    const normalizedWord = normalizeTrieWord(rawWord);
    let node = root;
    for (let characterIndex = 0; characterIndex < Array.from(normalizedWord).length; characterIndex += 1) {
      const character = Array.from(normalizedWord)[characterIndex];
      let child = node.children.get(character);
      let created = false;
      if (!child) {
        child = createTraceNode(`node-${nextNodeId}`, character, character, `edge-${nextEdgeId}`);
        nextNodeId += 1;
        nextEdgeId += 1;
        node.children.set(character, child);
        created = true;
      }
      child.passCount += 1;
      charactersProcessed += 1;
      trace.push(createStep({
        trace,
        phase: created ? "create-edge" : "reuse-edge",
        codeSteps: ["insert-word", "follow-or-create"],
        root,
        insertedWords,
        charactersProcessed,
        queryIndex: null,
        found: null,
        isPrefix: null,
        activeNodeIds: [child.id],
        changedNodeIds: created ? [child.id] : [],
        pointers: [{ nodeId: child.id, kind: "current", label: "insert" }],
        annotations: [{ nodeId: child.id, label: `${rawWord} · character ${characterIndex + 1}` }],
        narration: created
          ? `Create a ${character} edge for ${rawWord}.`
          : `Reuse the existing ${character} edge for ${rawWord}.`,
        prompt: "Will the next character reuse a node or create one?"
      }));
      node = child;
    }
    node.terminal = true;
    insertedWords += 1;
    trace.push(createStep({
      trace,
      phase: "mark-word",
      codeSteps: ["mark-terminal"],
      root,
      insertedWords,
      charactersProcessed,
      queryIndex: null,
      found: null,
      isPrefix: null,
      activeNodeIds: [node.id],
      changedNodeIds: [node.id],
      pointers: [{ nodeId: node.id, kind: "terminal", label: "word end" }],
      annotations: [{ nodeId: node.id, label: `${rawWord} ends here` }],
      narration: `Mark the end of ${rawWord}. A path is not a stored word until its final node is terminal.`,
      prompt: "Could another longer word continue beyond this terminal node?"
    }));
  }

  const normalizedQuery = normalizeTrieWord(query);
  const queryCharacters = Array.from(normalizedQuery);
  let node = root;
  let pathExists = true;
  for (let index = 0; index < queryCharacters.length; index += 1) {
    const character = queryCharacters[index];
    const child = node.children.get(character) ?? null;
    if (!child) {
      pathExists = false;
      trace.push(createStep({
        trace,
        phase: "missing-edge",
        codeSteps: ["search-query", "return-missing"],
        root,
        insertedWords,
        charactersProcessed,
        queryIndex: index,
        found: false,
        isPrefix: false,
        activeNodeIds: [node.id],
        pointers: [{ nodeId: node.id, kind: "current", label: "search" }],
        annotations: [{ nodeId: node.id, label: `no ${character} edge` }],
        visitedSearchIds,
        narration: `The query needs a ${character} edge, but none leaves this node.`,
        prompt: "Why can the search stop immediately?"
      }));
      break;
    }
    node = child;
    visitedSearchIds.add(node.id);
    trace.push(createStep({
      trace,
      phase: "follow-query",
      codeSteps: ["search-query", "follow-edge"],
      root,
      insertedWords,
      charactersProcessed,
      queryIndex: index,
      found: null,
      isPrefix: null,
      activeNodeIds: [node.id],
      pointers: [{ nodeId: node.id, kind: "current", label: "search" }],
      annotations: [{ nodeId: node.id, label: `matched ${character}` }],
      visitedSearchIds,
      narration: `Follow the ${character} edge for query position ${index}.`,
      prompt: index + 1 === queryCharacters.length
        ? "Does reaching this node prove a whole word or only a prefix?"
        : "Which edge must the next query character follow?"
    }));
  }

  const found = pathExists && node.terminal;
  const isPrefix = pathExists && (node.terminal || node.children.size > 0);
  const result = { found, isPrefix, normalizedQuery };
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: found ? ["return-found"] : pathExists ? ["return-prefix"] : ["return-missing"],
      root,
      insertedWords,
      charactersProcessed,
      queryIndex: queryCharacters.length - 1,
      found,
      isPrefix,
      activeNodeIds: pathExists ? [node.id] : [],
      pointers: pathExists ? [{ nodeId: node.id, kind: "result", label: found ? "word" : "prefix" }] : [],
      visitedSearchIds,
      narration: found
        ? `${query} follows a complete path whose final node is terminal.`
        : isPrefix
          ? `${query} follows a path, but its final node is not a stored word ending.`
          : `${query} does not follow a complete trie path.`,
      prompt: "What is the exact difference between a path, a prefix, and a stored word?"
    }),
    result
  });
  return trace;
}

function createTraceNode(id, value, edgeCharacter, edgeId) {
  return { id, value, edgeCharacter, edgeId, children: new Map(), terminal: false, passCount: 0 };
}

function createStep({
  trace,
  phase,
  codeSteps,
  root,
  insertedWords,
  charactersProcessed,
  queryIndex,
  found,
  isPrefix,
  narration,
  prompt,
  activeNodeIds = [],
  changedNodeIds = [],
  pointers = [],
  annotations = [],
  visitedSearchIds = new Set()
}) {
  const nodes = [];
  const edges = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    nodes.push({ id: node.id, value: node.value });
    for (const child of node.children.values()) {
      edges.push({ id: child.edgeId, fromId: node.id, toId: child.id, label: child.edgeCharacter });
      queue.push(child);
    }
  }
  const terminalIds = new Set();
  const nodeQueue = [root];
  while (nodeQueue.length) {
    const node = nodeQueue.shift();
    if (node.terminal) terminalIds.add(node.id);
    nodeQueue.push(...node.children.values());
  }
  return {
    step: trace.length,
    phase,
    codeSteps,
    insertedWords,
    charactersProcessed,
    queryIndex,
    found,
    isPrefix,
    view: {
      nodes,
      edges,
      rootIds: [root.id],
      activeNodeIds: [...activeNodeIds],
      changedNodeIds: [...changedNodeIds],
      states: [
        ...[...terminalIds].map((nodeId) => ({ nodeId, kind: "terminal", label: "word end" })),
        ...[...visitedSearchIds].filter((nodeId) => !terminalIds.has(nodeId)).map((nodeId) => ({ nodeId, kind: "visited", label: "query path" }))
      ],
      annotations: annotations.map((annotation) => ({ ...annotation })),
      pointers: pointers.map((pointer) => ({ ...pointer }))
    },
    narration,
    prompt
  };
}
