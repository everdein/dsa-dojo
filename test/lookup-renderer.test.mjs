import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLookupSnapshotOwnership,
  assertLookupView,
  lookupRendererAdapter,
  projectLookupView
} from "../studio/src/lookup-renderer.mjs";

test("lookup renderer validates and projects accessible entry models", () => {
  const view = createLookupView();
  assert.equal(assertLookupView(view, 0), view);
  assert.equal(lookupRendererAdapter.id, "lookup");
  assert.equal(lookupRendererAdapter.matchesView(view), true);

  const projected = projectLookupView(view);
  assert.deepEqual(projected.entries.map(({ key, valueText }) => [key, valueText]), [
    ["2", "3"],
    ["dojo", "ready"]
  ]);
  assert.equal(projected.entries[0].isActive, true);
  assert.equal(projected.entries[0].isResult, true);
  assert.equal(projected.entries[0].annotation, "incremented");
  assert.match(projected.entries[0].ariaLabel, /Key 2, value 3.*active.*part of result.*incremented/);
  assert.match(projected.ariaLabel, /Lookup with 2 entries/);
  assert.equal(projectLookupView(emptyLookupView()).ariaLabel, "Lookup is empty.");
});

test("lookup renderer rejects unsafe entries and dangling or duplicate references", () => {
  const cases = [
    [{ ...createLookupView(), entries: [{ key: "2", value: Infinity }] }, /lookup entry/],
    [{ ...createLookupView(), entries: [{ key: "2", value: 1, state: "bad state" }] }, /lookup entry/],
    [{ ...createLookupView(), entries: [{ key: "2", value: 1 }, { key: "2", value: 2 }] }, /lookup entry/],
    [{ ...createLookupView(), activeKeys: ["missing"] }, /unknown lookup active key/],
    [{ ...createLookupView(), resultKeys: ["2", "2"] }, /duplicate lookup result key/],
    [{ ...createLookupView(), annotations: [{ key: "missing", label: "nope" }] }, /lookup annotation/],
    [{ ...createLookupView(), annotations: [{ key: "2", label: "" }] }, /lookup annotation/]
  ];

  for (const [view, expected] of cases) {
    assert.throws(() => assertLookupView(view, 4), expected);
  }
});

test("lookup renderer requires fresh arrays and entry objects for exact rewind", () => {
  const first = createLookupView();
  const second = createLookupView();
  const trace = [{ view: first }, { view: second }];
  assert.equal(assertLookupSnapshotOwnership(trace), trace);

  second.entries = first.entries;
  assert.throws(() => assertLookupSnapshotOwnership(trace), /entries snapshot/);

  const third = createLookupView();
  const fourth = createLookupView();
  fourth.entries[0] = third.entries[0];
  assert.throws(
    () => assertLookupSnapshotOwnership([{ view: third }, { view: fourth }]),
    /entries objects/
  );

  const fifth = createLookupView();
  const sixth = createLookupView();
  sixth.annotations[0] = fifth.annotations[0];
  assert.throws(
    () => assertLookupSnapshotOwnership([{ view: fifth }, { view: sixth }]),
    /annotations objects/
  );
});

function createLookupView() {
  return {
    entries: [
      { key: "2", value: 3, state: "counted" },
      { key: "dojo", value: "ready" }
    ],
    activeKeys: ["2"],
    annotations: [{ key: "2", label: "incremented" }],
    resultKeys: ["2"]
  };
}

function emptyLookupView() {
  return {
    entries: [],
    activeKeys: [],
    annotations: [],
    resultKeys: []
  };
}
