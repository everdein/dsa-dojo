import {
  memoizedFibonacci,
  validateMemoizedFibonacciInput
} from "../../dynamic-programming/memoized-fibonacci.mjs";
import { countRecursiveFibonacciCalls } from "../../recursion/fibonacci.mjs";

export { memoizedFibonacci };

export function buildMemoizedFibonacciTrace(value) {
  validateMemoizedFibonacciInput(value);
  const trace = [];
  const nodes = [];
  const edges = [];
  const activePath = [];
  const memo = new Map();
  const completed = new Map();
  const cacheHitNodes = new Set();
  const naiveCalls = countRecursiveFibonacciCalls(value);
  let calls = 0;
  let cacheHits = 0;
  let computations = 0;
  let nextNode = 0;
  let nextEdge = 0;

  const addStep = ({
    phase,
    codeSteps,
    activeId = null,
    changedIds = [],
    callAnnotation = null,
    memoKey = null,
    memoAnnotation = null,
    memoResult = false,
    narration,
    prompt,
    result
  }) => {
    const states = [];
    for (const node of nodes) {
      if (completed.has(node.id)) {
        states.push({
          nodeId: node.id,
          kind: cacheHitNodes.has(node.id) ? "cache-hit" : "returned",
          label: cacheHitNodes.has(node.id)
            ? `cache returned ${completed.get(node.id)}`
            : `computed ${completed.get(node.id)}`
        });
      }
      if (activePath.includes(node.id) && node.id !== activeId) {
        states.push({ nodeId: node.id, kind: "waiting", label: "waiting for child" });
      }
    }

    const normalizedMemoKey = memoKey === null ? null : String(memoKey);
    const hasActiveMemoEntry = memoKey !== null && memo.has(memoKey);
    const step = {
      step: trace.length,
      phase,
      codeSteps: [...codeSteps],
      calls,
      memoizedCalls: calls,
      naiveCalls,
      cacheHits,
      computations,
      memoSize: memo.size,
      workSaved: phase === "complete" ? naiveCalls - calls : null,
      currentDepth: activePath.length,
      currentValue: activeId === null
        ? null
        : nodes.find(({ id }) => id === activeId).value,
      activePath: [...activePath],
      views: {
        calls: {
          nodes: nodes.map((node) => ({ ...node })),
          edges: edges.map((edge) => ({ ...edge })),
          rootIds: nodes.length === 0 ? [] : [nodes[0].id],
          activeNodeIds: activeId === null ? [] : [activeId],
          changedNodeIds: [...changedIds],
          states,
          annotations: callAnnotation === null ? [] : [{ ...callAnnotation }],
          pointers: activeId === null
            ? []
            : [{ nodeId: activeId, kind: "current", label: "current call" }]
        },
        memo: {
          entries: [...memo].map(([key, entryValue]) => ({
            key: String(key),
            value: entryValue,
            state: "cached"
          })),
          activeKeys: hasActiveMemoEntry ? [normalizedMemoKey] : [],
          annotations: hasActiveMemoEntry && memoAnnotation !== null
            ? [{ key: normalizedMemoKey, label: memoAnnotation }]
            : [],
          resultKeys: hasActiveMemoEntry && memoResult ? [normalizedMemoKey] : []
        }
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  addStep({
    phase: "initialize",
    codeSteps: ["initialize"],
    narration: `Start fib(${value}) with an empty memo table. Naive recursion would make ${naiveCalls} calls.`,
    prompt: "Which subproblem will be the first memo-table key?"
  });

  const visit = (current, parentId = null, branch = null) => {
    const id = `call-${nextNode}`;
    nextNode += 1;
    nodes.push({ id, value: current });
    if (parentId !== null) {
      edges.push({
        id: `edge-${nextEdge}`,
        fromId: parentId,
        toId: id,
        label: branch
      });
      nextEdge += 1;
    }

    calls += 1;
    activePath.push(id);
    addStep({
      phase: "call",
      codeSteps: ["function", "check-cache"],
      activeId: id,
      changedIds: [id],
      callAnnotation: { nodeId: id, label: `check memo[${current}]` },
      memoKey: current,
      narration: memo.has(current)
        ? `Enter fib(${current}). Its result is already in the memo table.`
        : `Enter fib(${current}). The memo table does not contain this subproblem yet.`,
      prompt: memo.has(current)
        ? "How much of this call tree can the cached value replace?"
        : current <= 1
          ? "Can this base case be stored immediately?"
          : "Which smaller values must be solved before this result can be cached?"
    });

    if (memo.has(current)) {
      const result = memo.get(current);
      cacheHits += 1;
      cacheHitNodes.add(id);
      completed.set(id, result);
      addStep({
        phase: "cache-hit",
        codeSteps: ["return-cached"],
        activeId: id,
        changedIds: [id],
        callAnnotation: { nodeId: id, label: `reuse ${result}` },
        memoKey: current,
        memoAnnotation: `cache hit: return ${result}`,
        memoResult: true,
        narration: `Memo hit: fib(${current}) is ${result}, so this call returns without creating a repeated subtree.`,
        prompt: "Which waiting call receives this cached result?"
      });
      activePath.pop();
      return result;
    }

    if (current <= 1) {
      computations += 1;
      memo.set(current, current);
      completed.set(id, current);
      addStep({
        phase: "base-case",
        codeSteps: ["check-base", "store-base"],
        activeId: id,
        changedIds: [id],
        callAnnotation: { nodeId: id, label: `cache and return ${current}` },
        memoKey: current,
        memoAnnotation: `base case stored as ${current}`,
        memoResult: true,
        narration: `fib(${current}) is a base case. Store ${current} before returning it.`,
        prompt: "When can a later call reuse this base-case entry?"
      });
      activePath.pop();
      return current;
    }

    addStep({
      phase: "expand",
      codeSteps: ["check-base", "recurse"],
      activeId: id,
      callAnnotation: { nodeId: id, label: `need fib(${current - 1}) and fib(${current - 2})` },
      memoKey: current,
      narration: `fib(${current}) is not cached or a base case, so solve fib(${current - 1}) and fib(${current - 2}).`,
      prompt: `Which of those two descendants is more likely to become a cache hit?`
    });

    const left = visit(current - 1, id, "n-1");
    const right = visit(current - 2, id, "n-2");
    const result = left + right;
    computations += 1;
    memo.set(current, result);
    completed.set(id, result);
    addStep({
      phase: "store-result",
      codeSteps: ["recurse", "combine", "store-result"],
      activeId: id,
      changedIds: [id],
      callAnnotation: { nodeId: id, label: `${left} + ${right} = ${result}` },
      memoKey: current,
      memoAnnotation: `combined result stored as ${result}`,
      memoResult: true,
      narration: `Both children returned. Combine ${left} + ${right} = ${result}, then cache fib(${current}).`,
      prompt: "Which future call can now stop at this memo entry?"
    });
    activePath.pop();
    return result;
  };

  const result = visit(value);
  addStep({
    phase: "complete",
    codeSteps: ["return-result"],
    activeId: nodes[0].id,
    changedIds: [nodes[0].id],
    callAnnotation: { nodeId: nodes[0].id, label: `fib(${value}) = ${result}` },
    memoKey: value,
    memoAnnotation: `final result ${result}`,
    memoResult: true,
    narration: `Memoization returns ${result} in ${calls} calls instead of the naive tree's ${naiveCalls}, avoiding ${naiveCalls - calls} calls.`,
    prompt: "Why does the memoized call tree grow linearly even though the recurrence still has two branches?",
    result
  });

  return trace;
}
