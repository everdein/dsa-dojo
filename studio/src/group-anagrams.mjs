import {
  anagramSignature,
  groupAnagrams,
  normalizeAnagramWord,
  validateGroupAnagramsInput
} from "../../hash-maps-and-sets/group-anagrams.mjs";

export { groupAnagrams };

export function buildGroupAnagramsTrace(words) {
  validateGroupAnagramsInput(words);

  const groups = new Map();
  const trace = [];

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize"],
    words,
    groups,
    currentIndex: null,
    normalizedWord: null,
    signature: null,
    groupIndex: null,
    groupSize: 0,
    processedCount: 0,
    changedSignature: null,
    narration: "Start with no groups. Each word will derive one canonical signature that decides where it belongs.",
    prompt: "Prediction: which differently ordered words will produce the same signature?"
  }));

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const normalizedWord = normalizeAnagramWord(word);
    const signature = anagramSignature(word);
    const existingGroup = groups.get(signature);
    const phase = existingGroup ? "append-group" : "create-group";

    if (existingGroup) existingGroup.push(word);
    else groups.set(signature, [word]);

    const group = groups.get(signature);
    const groupIndex = [...groups.keys()].indexOf(signature);
    trace.push(createStep({
      trace,
      phase,
      codeSteps: existingGroup
        ? ["loop", "build-signature", "find-group", "append-word"]
        : ["loop", "build-signature", "find-group", "create-group", "append-word"],
      words,
      groups,
      currentIndex: index,
      normalizedWord,
      signature,
      groupIndex,
      groupSize: group.length,
      processedCount: index + 1,
      changedSignature: signature,
      narration: existingGroup
        ? `${formatWord(word)} normalizes to ${formatWord(normalizedWord)} and shares signature ${formatSignature(signature)} with group ${groupIndex + 1}, so append it without changing group order.`
        : `${formatWord(word)} normalizes to ${formatWord(normalizedWord)} and creates group ${groupIndex + 1} under signature ${formatSignature(signature)}.`,
      prompt: existingGroup
        ? "Why does matching the sorted signature prove these words are anagrams?"
        : "Will a later word reuse this signature or create another group?"
    }));
  }

  const result = groupAnagrams(words);
  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: ["return"],
      words,
      groups,
      currentIndex: null,
      normalizedWord: null,
      signature: null,
      groupIndex: null,
      groupSize: 0,
      processedCount: words.length,
      changedSignature: null,
      complete: true,
      narration: `${words.length} ${words.length === 1 ? "word forms" : "words form"} ${groups.size} ordered ${groups.size === 1 ? "group" : "groups"}. Words inside each group remain in input order.`,
      prompt: "How does the signature remove letter order while the groups preserve word order?"
    }),
    result
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  words,
  groups,
  currentIndex,
  normalizedWord,
  signature,
  groupIndex,
  groupSize,
  processedCount,
  changedSignature,
  narration,
  prompt,
  complete = false
}) {
  return {
    step: trace.length,
    phase,
    codeSteps,
    currentIndex,
    currentWord: currentIndex === null ? null : words[currentIndex],
    normalizedWord,
    signature,
    groupIndex,
    groupSize,
    processedCount,
    groupCount: groups.size,
    view: buildLookupView(groups, signature, changedSignature, groupIndex, complete),
    narration,
    prompt
  };
}

function buildLookupView(groups, activeSignature, changedSignature, groupIndex, complete) {
  return {
    entries: [...groups].map(([key, words]) => ({
      key,
      value: words.join(", "),
      state: complete ? "result" : key === changedSignature ? "updated" : "grouped"
    })),
    activeKeys: activeSignature === null ? [] : [activeSignature],
    annotations: changedSignature === null
      ? []
      : [{
          key: changedSignature,
          label: `group ${groupIndex + 1} · size ${groups.get(changedSignature).length}`
        }],
    resultKeys: complete ? [...groups.keys()] : []
  };
}

function formatWord(word) {
  return `“${word}”`;
}

function formatSignature(signature) {
  return `“${signature}”`;
}
