import test from "node:test";
import assert from "node:assert/strict";
import {
  isPalindrome,
  isPalindromeCharacter,
  maximumPalindromeCharacters,
  normalizePalindromeCharacter,
  validatePalindromeInput
} from "../strings/valid-palindrome.mjs";
import {
  buildValidPalindromeTrace,
  formatCharacter
} from "../studio/src/valid-palindrome.mjs";
import {
  parsePalindromeText,
  validPalindromeLesson
} from "../studio/src/lessons/valid-palindrome.mjs";
import {
  assertLesson,
  buildValidatedTrace
} from "../studio/src/lesson-contract.mjs";
import { projectSequenceView } from "../studio/src/sequence-renderer.mjs";

test("valid-palindrome compares Unicode letters and numbers while ignoring formatting", () => {
  const examples = [
    ["A man, a plan, a canal: Panama!", true],
    ["No 'x' in Nixon", true],
    ["Été", true],
    ["𐐀x𐐨", true],
    ["123 2 1", true],
    ["race a car", false],
    ["ab", false],
    ["0P", false]
  ];

  for (const [text, expected] of examples) {
    assert.equal(isPalindrome(text), expected, text);
  }
});

test("valid-palindrome uses explicit Unicode and deterministic normalization semantics", () => {
  assert.equal(isPalindromeCharacter("é"), true);
  assert.equal(isPalindromeCharacter("٤"), true);
  assert.equal(isPalindromeCharacter("𐐀"), true);
  assert.equal(isPalindromeCharacter("😀"), false);
  assert.equal(isPalindromeCharacter("-"), false);
  assert.equal(isPalindromeCharacter("ab"), false);
  assert.equal(normalizePalindromeCharacter("É"), "é");
  assert.equal(normalizePalindromeCharacter("𐐀"), "𐐨");
  assert.throws(() => normalizePalindromeCharacter("!"), /single Unicode letter or number/);
});

test("valid-palindrome enforces its bounded lesson input without counting UTF-16 units", () => {
  const maximumCodePoints = `${"😀".repeat(maximumPalindromeCharacters - 1)}A`;
  assert.equal(Array.from(maximumCodePoints).length, maximumPalindromeCharacters);
  assert.equal(validatePalindromeInput(maximumCodePoints), maximumCodePoints);
  assert.equal(isPalindrome(maximumCodePoints), true);

  const tooLong = `${"😀".repeat(maximumPalindromeCharacters)}A`;
  assert.throws(() => validatePalindromeInput(tooLong), /48 characters or fewer/);

  for (const invalid of [undefined, null, 42, {}, [], "", "   ", "😀!?—"]) {
    assert.throws(() => validatePalindromeInput(invalid));
  }
});

test("valid-palindrome lesson parsing preserves the learner's raw sequence", () => {
  assert.equal(parsePalindromeText("  Never odd or even!  "), "  Never odd or even!  ");
  assert.throws(() => parsePalindromeText("  ...  "), /letter or number/);
  assert.deepEqual(
    validPalindromeLesson.input.serialize({ text: "Able was I" }),
    { text: "Able was I" }
  );
  assert.deepEqual(
    validPalindromeLesson.input.parse({ text: "Level" }),
    { text: "Level" }
  );
});

test("valid-palindrome lesson supplies the sequence renderer and curriculum metadata", () => {
  assert.equal(assertLesson(validPalindromeLesson), validPalindromeLesson);
  assert.equal(validPalindromeLesson.id, "strings/valid-palindrome");
  assert.equal(validPalindromeLesson.order, 8);
  assert.equal(validPalindromeLesson.renderer, "sequence");
  assert.deepEqual(validPalindromeLesson.prerequisites, ["arrays/reverse-array"]);
  assert.deepEqual(validPalindromeLesson.patterns, ["strings", "two-pointers"]);

  const mappedCodeSteps = new Set(validPalindromeLesson.code.lines.flatMap((line) => line.steps));
  for (const codeStep of [
    "initialize",
    "check-pointers",
    "skip-left",
    "skip-right",
    "compare",
    "return-false",
    "move-pointers",
    "return-true"
  ]) {
    assert.equal(mappedCodeSteps.has(codeStep), true, codeStep);
  }
});

test("valid-palindrome trace exposes skipping, normalized comparisons, and exact rewind snapshots", () => {
  const input = { text: "A😀,b b—a" };
  const trace = buildValidatedTrace(validPalindromeLesson, input);

  assert.deepEqual(trace.at(0).view.values, Array.from(input.text));
  assert.equal(trace.at(-1).result, true);
  assert.equal(trace.at(-1).comparisons, 2);
  assert.equal(trace.at(-1).matchedPairs, 2);
  assert.equal(trace.at(-1).ignoredCount, 4);
  assert.ok(trace.some((step) => step.phase === "skip-left"));
  assert.ok(trace.some((step) => step.phase === "skip-right"));

  const comparisons = trace.filter((step) => step.compared);
  assert.deepEqual(
    comparisons.map((step) => [step.normalizedLeft, step.normalizedRight, step.matched]),
    [["a", "a", true], ["b", "b", true]]
  );

  trace.forEach((step, index) => {
    assert.equal(step.step, index);
    assert.deepEqual(step.view.values, Array.from(input.text));
    for (const range of step.view.ranges) {
      assert.ok(range.start >= 0);
      assert.ok(range.start <= range.end);
      assert.ok(range.end < step.view.values.length);
    }
  });

  for (const property of ["values", "activeIndices", "ranges", "markers", "annotations", "changedIndices"]) {
    assert.equal(new Set(trace.map((step) => step.view[property])).size, trace.length, property);
  }
  for (const property of ["ranges", "markers", "annotations"]) {
    const objects = trace.flatMap((step) => step.view[property]);
    assert.equal(new Set(objects).size, objects.length, property);
  }
});

test("valid-palindrome trace stops on the first unequal normalized pair", () => {
  const trace = buildValidPalindromeTrace("ab😀c");
  const mismatch = trace.find((step) => step.phase === "mismatch");

  assert.ok(mismatch);
  assert.equal(mismatch.leftIndex, 0);
  assert.equal(mismatch.rightIndex, 3);
  assert.equal(mismatch.normalizedLeft, "a");
  assert.equal(mismatch.normalizedRight, "c");
  assert.equal(mismatch.comparisons, 1);
  assert.equal(trace.at(-1).phase, "complete");
  assert.equal(trace.at(-1).result, false);
  assert.deepEqual(trace.at(-1).view.activeIndices, [0, 3]);
});

test("valid-palindrome singleton and astral characters remain one sequence cell each", () => {
  const singleton = buildValidPalindromeTrace("7");
  assert.deepEqual(singleton.map((step) => step.phase), ["initialize", "check", "complete"]);
  assert.equal(singleton.at(-1).comparisons, 0);
  assert.equal(singleton.at(-1).result, true);

  const astral = buildValidPalindromeTrace("𐐀😀𐐨");
  assert.deepEqual(astral[0].view.values, ["𐐀", "😀", "𐐨"]);
  assert.equal(astral.at(-1).result, true);
  assert.equal(formatCharacter("😀"), "“😀”");
  assert.equal(formatCharacter(" "), "space");
});

test("sequence projection preserves visible characters and accessible state", () => {
  const [space, letter] = projectSequenceView({
    values: [" ", "A"],
    activeIndices: [1],
    ranges: [{ start: 0, end: 1, kind: "candidate", label: "unresolved range" }],
    markers: [{ index: 1, kind: "right", label: "right" }],
    annotations: [{ index: 0, label: "ignored" }],
    changedIndices: []
  });

  assert.equal(space.formattedValue, "·");
  assert.match(space.ariaLabel, /space.*ignored/);
  assert.equal(letter.formattedValue, "A");
  assert.equal(letter.active, true);
  assert.match(letter.ariaLabel, /Character 1.*active.*right/);
});
