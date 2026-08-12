import {
  createTrie,
  normalizeTrieWord,
  validateTrieInput
} from "../../tries/trie-insert-search.mjs";
import { countTriePrefix } from "../../tries/prefix-count.mjs";

export { countTriePrefix };

export function buildPrefixCountTrace({ words, prefix }) {
  validateTrieInput(words, prefix);
  const root = createTrie(words);
  const topology = createTopology(root);
  const normalizedPrefix = normalizeTrieWord(prefix);
  const characters = Array.from(normalizedPrefix);
  const visitedNodeIds = new Set();
  const trace = [];
  let node = root;
  let matchedCharacters = 0;
  let missingCharacter = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["build-trie"],
    topology,
    visitedNodeIds,
    activeNode: root,
    prefixIndex: null,
    normalizedPrefix,
    matchedCharacters,
    missingCharacter,
    count: null,
    narration: `Build the completed trie for ${words.length} inserted ${words.length === 1 ? "word" : "words"}. Each node already stores how many insertions pass through it.`,
    prompt: "Which node should hold the count for the whole requested prefix?"
  }));

  for (let prefixIndex = 0; prefixIndex < characters.length; prefixIndex += 1) {
    const character = characters[prefixIndex];
    const next = node.children.get(character) ?? null;
    if (next === null) {
      missingCharacter = character;
      trace.push(createStep({
        trace,
        phase: "missing-edge",
        codeSteps: ["follow-prefix", "return-zero"],
        topology,
        visitedNodeIds,
        activeNode: node,
        prefixIndex,
        normalizedPrefix,
        matchedCharacters,
        missingCharacter,
        count: 0,
        annotation: `no ${character} edge`,
        narration: `No ${character} edge leaves the current node, so no inserted word can begin with ${normalizedPrefix}.`,
        prompt: "Why can the prefix count return zero immediately?"
      }));
      break;
    }

    node = next;
    matchedCharacters += 1;
    visitedNodeIds.add(node.id);
    trace.push(createStep({
      trace,
      phase: "follow-prefix",
      codeSteps: ["follow-prefix", "read-edge"],
      topology,
      visitedNodeIds,
      activeNode: node,
      prefixIndex,
      normalizedPrefix,
      matchedCharacters,
      missingCharacter,
      count: null,
      annotation: `matched ${character}`,
      narration: `Follow the ${character} edge for normalized prefix position ${prefixIndex + 1}.`,
      prompt: prefixIndex + 1 === characters.length
        ? "What aggregate is already stored at this final prefix node?"
        : "Which edge must the next normalized character follow?"
    }));
  }

  const count = missingCharacter === null ? node.passCount : 0;
  const result = { normalizedPrefix, count };
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: missingCharacter === null ? ["read-count", "return-count"] : ["return-zero"],
      topology,
      visitedNodeIds,
      activeNode: missingCharacter === null ? node : null,
      prefixIndex: characters.length - 1,
      normalizedPrefix,
      matchedCharacters,
      missingCharacter,
      count,
      annotation: missingCharacter === null ? `${count} words pass here` : null,
      resultNodeId: missingCharacter === null ? node.id : null,
      narration: missingCharacter === null
        ? `The final prefix node has passCount ${count}, so ${count} inserted ${count === 1 ? "word begins" : "words begin"} with ${normalizedPrefix}.`
        : `${normalizedPrefix} is missing from the trie, so its prefix count is zero.`,
      prompt: missingCharacter === null
        ? "Why do duplicate inserted words increase this aggregate independently?"
        : "Would adding any word with this prefix create the missing path?"
    }),
    result
  });
  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  topology,
  visitedNodeIds,
  activeNode,
  prefixIndex,
  normalizedPrefix,
  matchedCharacters,
  missingCharacter,
  count,
  narration,
  prompt,
  annotation = null,
  resultNodeId = null
}) {
  const states = [
    ...topology.terminalNodeIds.map((nodeId) => ({
      nodeId,
      kind: "terminal",
      label: "word end"
    })),
    ...[...visitedNodeIds]
      .filter((nodeId) => !topology.terminalNodeIds.includes(nodeId))
      .map((nodeId) => ({ nodeId, kind: "visited", label: "prefix path" }))
  ];
  if (
    resultNodeId !== null
    && !states.some(({ nodeId, kind }) => nodeId === resultNodeId && kind === "aggregate")
  ) {
    states.push({ nodeId: resultNodeId, kind: "aggregate", label: "prefix aggregate" });
  }

  return {
    step: trace.length,
    phase,
    codeSteps,
    normalizedPrefix,
    prefixIndex,
    matchedCharacters,
    totalCharacters: Array.from(normalizedPrefix).length,
    missingCharacter,
    count,
    currentNodeId: activeNode?.id ?? null,
    currentPassCount: activeNode?.passCount ?? null,
    view: {
      nodes: topology.nodes.map((node) => ({ ...node })),
      edges: topology.edges.map((edge) => ({ ...edge })),
      rootIds: [topology.rootId],
      activeNodeIds: activeNode === null ? [] : [activeNode.id],
      changedNodeIds: resultNodeId === null ? [] : [resultNodeId],
      states: states.map((state) => ({ ...state })),
      annotations: annotation === null || activeNode === null
        ? []
        : [{ nodeId: activeNode.id, label: annotation }],
      pointers: activeNode === null ? [] : [{
        nodeId: activeNode.id,
        kind: resultNodeId === null ? "current" : "result",
        label: resultNodeId === null ? "prefix search" : "count here"
      }]
    },
    narration,
    prompt
  };
}

function createTopology(root) {
  const nodes = [];
  const edges = [];
  const terminalNodeIds = [];
  const pending = [root];
  let edgeIndex = 0;
  while (pending.length > 0) {
    const node = pending.shift();
    nodes.push({ id: node.id, value: node.value });
    if (node.terminal) terminalNodeIds.push(node.id);
    for (const child of node.children.values()) {
      edges.push({
        id: `edge-${edgeIndex}`,
        fromId: node.id,
        toId: child.id,
        label: child.edgeCharacter
      });
      edgeIndex += 1;
      pending.push(child);
    }
  }
  return { nodes, edges, rootId: root.id, terminalNodeIds };
}
