import {
  findPairSum,
  validatePairSumInput
} from "../../arrays/pair-sum.mjs";
import { formatNumber } from "./input.mjs";

export { findPairSum };

export function buildPairSumTrace({ values, target }) {
  validatePairSumInput(values, target);

  const trace = [];
  const earliestIndexByValue = new Map();
  let currentIndex = null;
  let currentValue = null;
  let complement = null;
  let pair = null;

  trace.push(createStep({
    trace,
    phase: "initialize",
    codeSteps: ["initialize-map"],
    values,
    target,
    earliestIndexByValue,
    currentIndex,
    currentValue,
    complement,
    pair,
    narration: `Start with an empty lookup map. Each entry will connect a value already seen to its earliest index.`,
    prompt: `Prediction: what complement does ${formatNumber(values[0])} need to reach ${formatNumber(target)}?`
  }));

  for (let index = 0; index < values.length; index += 1) {
    currentIndex = index;
    currentValue = values[index];
    const computedComplement = target - currentValue;
    complement = Number.isFinite(computedComplement) ? computedComplement : null;
    const hasComplement = complement !== null && earliestIndexByValue.has(complement);

    trace.push(createStep({
      trace,
      phase: "lookup",
      codeSteps: ["compute-complement", "lookup-complement"],
      values,
      target,
      earliestIndexByValue,
      currentIndex,
      currentValue,
      complement,
      pair,
      activeLookupKey: hasComplement ? lookupKey(complement) : null,
      narration: hasComplement
        ? `${formatNumber(currentValue)} needs ${formatNumber(complement)}. That complement is already in the map.`
        : complement === null
          ? `${formatNumber(currentValue)} would need a value outside JavaScript's finite numeric range, so no earlier value can be its complement.`
        : `${formatNumber(currentValue)} needs ${formatNumber(complement)}. The map does not contain that complement yet.`,
      prompt: hasComplement
        ? "Which earlier index completes the pair?"
        : "What should be remembered before the scan moves on?"
    }));

    if (hasComplement) {
      const earlierIndex = earliestIndexByValue.get(complement);
      pair = {
        indices: [earlierIndex, index],
        values: [values[earlierIndex], currentValue]
      };
      trace.push(createStep({
        trace,
        phase: "found",
        codeSteps: ["return-pair"],
        values,
        target,
        earliestIndexByValue,
        currentIndex,
        currentValue,
        complement,
        pair,
        activeLookupKey: lookupKey(complement),
        resultLookupKeys: [lookupKey(complement)],
        lookupAnnotations: [{
          key: lookupKey(complement),
          label: `pairs with index ${index}`
        }],
        narration: `Index ${earlierIndex} holds ${formatNumber(complement)}, so indices ${earlierIndex} and ${index} sum to ${formatNumber(target)}.`,
        prompt: "Why could the current value not have matched itself before this iteration?"
      }));
      break;
    }

    const alreadySeen = earliestIndexByValue.has(currentValue);
    if (!alreadySeen) earliestIndexByValue.set(currentValue, index);
    trace.push(createStep({
      trace,
      phase: alreadySeen ? "keep-earliest" : "remember",
      codeSteps: ["remember-value"],
      values,
      target,
      earliestIndexByValue,
      currentIndex,
      currentValue,
      complement,
      pair,
      activeLookupKey: lookupKey(currentValue),
      lookupAnnotations: [{
        key: lookupKey(currentValue),
        label: alreadySeen ? "earliest index kept" : "added now"
      }],
      narration: alreadySeen
        ? `${formatNumber(currentValue)} was seen earlier, so keep its earliest index ${earliestIndexByValue.get(currentValue)}.`
        : `Remember ${formatNumber(currentValue)} at index ${index}. A later value can now find it in constant average time.`,
      prompt: index + 1 < values.length
        ? `What complement will ${formatNumber(values[index + 1])} need?`
        : "The scan has no values left. What result should it return?"
    }));
  }

  trace.push({
    ...createStep({
      trace,
      phase: "complete",
      codeSteps: [pair ? "return-pair" : "return-none"],
      values,
      target,
      earliestIndexByValue,
      currentIndex,
      currentValue,
      complement,
      pair,
      resultLookupKeys: pair ? [lookupKey(pair.values[0])] : [],
      complete: true,
      narration: pair
        ? `Pair Sum found indices ${pair.indices[0]} and ${pair.indices[1]} in one left-to-right scan.`
        : `The scan finished without finding two distinct values that sum to ${formatNumber(target)}.`,
      prompt: pair
        ? "Explain why every map entry came from an earlier index."
        : "Why does checking every value's complement prove that no pair exists?"
    }),
    result: clonePair(pair)
  });

  return trace;
}

function createStep({
  trace,
  phase,
  codeSteps,
  values,
  target,
  earliestIndexByValue,
  currentIndex,
  currentValue,
  complement,
  pair,
  narration,
  prompt,
  activeLookupKey = null,
  lookupAnnotations = [],
  resultLookupKeys = [],
  complete = false
}) {
  const pairIndices = pair?.indices ?? [];
  return {
    step: trace.length,
    phase,
    codeSteps,
    target,
    currentIndex,
    currentValue,
    complement,
    complementInRange: complement !== null,
    valuesSeen: earliestIndexByValue.size,
    found: pair !== null,
    pair: clonePair(pair),
    views: {
      values: {
        values: [...values],
        activeIndices: complete ? [...pairIndices] : currentIndex === null ? [] : [currentIndex],
        ranges: [],
        markers: pairIndices.map((index) => ({ index, kind: "pair", label: "pair" })),
        annotations: arrayAnnotations(values, currentIndex, complement, pair, complete),
        changedIndices: []
      },
      seen: {
        entries: [...earliestIndexByValue].map(([key, value]) => ({
          key: lookupKey(key),
          value,
          state: resultLookupKeys.includes(lookupKey(key)) ? "result" : "seen"
        })),
        activeKeys: activeLookupKey === null ? [] : [activeLookupKey],
        annotations: lookupAnnotations.map((annotation) => ({ ...annotation })),
        resultKeys: [...resultLookupKeys]
      }
    },
    narration,
    prompt
  };
}

function arrayAnnotations(values, currentIndex, complement, pair, complete) {
  if (pair) {
    return pair.indices.map((index) => ({
      index,
      label: complete ? "result" : `value ${formatNumber(values[index])}`
    }));
  }
  if (complete) return [];
  if (currentIndex === null) return [];
  return [{
    index: currentIndex,
    label: complement === null ? "complement outside finite range" : `needs ${formatNumber(complement)}`
  }];
}

export function lookupKey(value) {
  if (!Number.isFinite(value)) throw new Error("Lookup keys require finite numbers.");
  // JavaScript Map treats -0 and 0 as the same key, so the visual key does too.
  return Object.is(value, -0) ? "0" : String(value);
}

function clonePair(pair) {
  return pair === null ? null : {
    indices: [...pair.indices],
    values: [...pair.values]
  };
}
