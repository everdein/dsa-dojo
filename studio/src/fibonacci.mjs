import {
  recursiveFibonacci,
  validateRecursiveFibonacciInput
} from "../../recursion/fibonacci.mjs";

export { recursiveFibonacci };

export function buildRecursiveFibonacciTrace(value) {
  validateRecursiveFibonacciInput(value);
  const trace = [];
  const nodes = [];
  const edges = [];
  const completed = new Map();
  const seenCounts = new Map();
  const activePath = [];
  let calls = 0;
  let repeatedCalls = 0;
  let returns = 0;
  let nextNode = 0;
  let nextEdge = 0;

  const addStep = ({ phase, codeSteps, activeId = null, changedIds = [], annotation = null, narration, prompt, result }) => {
    const states = [];
    for (const node of nodes) {
      if (completed.has(node.id)) states.push({ nodeId: node.id, kind: "returned", label: `returned ${completed.get(node.id)}` });
      if ((seenCounts.get(node.value) ?? 0) > 1) states.push({ nodeId: node.id, kind: "repeated", label: `repeated fib(${node.value})` });
      if (activePath.includes(node.id) && node.id !== activeId) states.push({ nodeId: node.id, kind: "waiting", label: "waiting for child" });
    }
    const step = {
      step: trace.length,
      phase,
      codeSteps,
      calls,
      repeatedCalls,
      returns,
      currentDepth: activePath.length,
      currentValue: activeId === null ? null : nodes.find(({ id }) => id === activeId).value,
      view: {
        nodes: nodes.map((node) => ({ ...node })),
        edges: edges.map((edge) => ({ ...edge })),
        rootIds: nodes.length ? [nodes[0].id] : [],
        activeNodeIds: activeId === null ? [] : [activeId],
        changedNodeIds: [...changedIds],
        states,
        annotations: annotation === null ? [] : [{ ...annotation }],
        pointers: activeId === null ? [] : [{ nodeId: activeId, kind: "current", label: "current call" }]
      },
      narration,
      prompt
    };
    if (result !== undefined) step.result = result;
    trace.push(step);
  };

  const visit = (current, parentId = null, branch = null) => {
    const id = `call-${nextNode}`;
    nextNode += 1;
    nodes.push({ id, value: current });
    if (parentId !== null) {
      edges.push({ id: `edge-${nextEdge}`, fromId: parentId, toId: id, label: branch });
      nextEdge += 1;
    }
    const priorCount = seenCounts.get(current) ?? 0;
    seenCounts.set(current, priorCount + 1);
    calls += 1;
    if (priorCount > 0) repeatedCalls += 1;
    activePath.push(id);
    addStep({
      phase: "call",
      codeSteps: ["call-function", "check-base"],
      activeId: id,
      changedIds: [id],
      annotation: { nodeId: id, label: priorCount > 0 ? `call ${priorCount + 1} for n=${current}` : `first call for n=${current}` },
      narration: priorCount > 0
        ? `Call fib(${current}) again. This repeated subtree performs work the earlier call already did.`
        : `Enter fib(${current}) and check whether it is a base case.`,
      prompt: current <= 1 ? "What value can this base case return immediately?" : "Which two smaller calls must this frame wait for?"
    });

    if (current <= 1) {
      completed.set(id, current);
      returns += 1;
      addStep({
        phase: "base-case",
        codeSteps: ["return-base"],
        activeId: id,
        changedIds: [id],
        annotation: { nodeId: id, label: `return ${current}` },
        narration: `fib(${current}) is a base case, so it returns ${current} without making children.`,
        prompt: "Which waiting parent receives this return value?"
      });
      activePath.pop();
      return current;
    }

    const left = visit(current - 1, id, "n-1");
    const right = visit(current - 2, id, "n-2");
    const result = left + right;
    completed.set(id, result);
    returns += 1;
    addStep({
      phase: "combine",
      codeSteps: ["recurse", "combine-return"],
      activeId: id,
      changedIds: [id],
      annotation: { nodeId: id, label: `${left} + ${right} = ${result}` },
      narration: `Both children of fib(${current}) returned. Combine ${left} and ${right} to return ${result}.`,
      prompt: "How many of the completed calls repeated a subproblem?"
    });
    activePath.pop();
    return result;
  };

  const result = visit(value);
  addStep({
    phase: "complete",
    codeSteps: ["combine-return"],
    activeId: nodes[0].id,
    annotation: { nodeId: nodes[0].id, label: `fib(${value}) = ${result}` },
    narration: `The root call returns ${result} after ${calls} total calls, including ${repeatedCalls} repeated calls.`,
    prompt: "Which repeated subproblems could a memo table compute only once?",
    result
  });
  return trace;
}
