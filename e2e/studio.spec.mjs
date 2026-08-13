import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { curriculumLessons } from "../studio/src/curriculum-manifest.mjs";

const lessons = [
  ["arrays%2Ffind-largest", "Find the largest value"],
  ["arrays%2Fsliding-window", "Find the best fixed window"],
  ["arrays%2Freverse-array", "Reverse an array in pairs"],
  ["arrays%2Fmove-zeros", "Move zeros to the end"],
  ["linked-lists%2Ftraverse-linked-list", "Traverse a linked list"],
  ["linked-lists%2Freverse-linked-list", "Reverse a linked list"],
  ["linked-lists%2Fdetect-cycle", "Detect a cycle with two speeds"],
  ["strings%2Fvalid-palindrome", "Check whether text is a palindrome"],
  ["arrays%2Fpair-sum", "Find two values that reach a target"],
  ["arrays%2Ffrequency-count", "Count how often each value appears"],
  ["strings%2Ffirst-non-repeating", "Find the first non-repeating character"],
  ["matrices%2Ftraverse-matrix", "Traverse a matrix row by row"],
  ["matrices%2Frotate-matrix", "Rotate a matrix clockwise"],
  ["hash-maps-and-sets%2Ffind-duplicates", "Find duplicates with a set"],
  ["arrays%2Flongest-consecutive", "Find the longest consecutive sequence"],
  ["hash-maps-and-sets%2Fgroup-anagrams", "Group words that contain the same letters"],
  ["stacks%2Fvalid-parentheses", "Validate nested brackets with a stack"],
  ["stacks%2Fmin-stack", "Maintain a minimum inside a stack"],
  ["stacks%2Fevaluate-postfix", "Evaluate postfix expressions with a value stack"],
  ["queues%2Fqueue-operations", "Run first-in, first-out queue operations"],
  ["queues%2Fsliding-window-maximum", "Emit every window maximum"],
  ["patterns%2Fprefix-sum-range-queries", "Answer range sums with a prefix array"],
  ["patterns%2Fmerge-intervals", "Merge overlapping closed intervals"],
  ["searching%2Fbinary-search", "Search a sorted array by halving"],
  ["trees%2Finorder-traversal", "Traverse a binary tree inorder"],
  ["trees%2Flevel-order-traversal", "Traverse a tree breadth first"],
  ["trees%2Fvalidate-bst", "Validate a binary search tree with bounds"],
  ["tries%2Ftrie-insert-search", "Insert and search words in a trie"],
  ["tries%2Fprefix-count", "Count words beneath a trie prefix"],
  ["heaps-and-priority-queues%2Fheap-operations", "Insert and remove from a min-heap"],
  ["heaps-and-priority-queues%2Fk-largest", "Find the k largest elements"],
  ["heaps-and-priority-queues%2Ftop-k-frequent", "Select the top k frequent values"],
  ["heaps-and-priority-queues%2Fmerge-k-sorted-lists", "Merge k sorted linked lists"],
  ["graphs%2Fconnected-components", "Find connected components with BFS"],
  ["graphs%2Funweighted-shortest-path", "Find an unweighted shortest path"],
  ["graphs%2Fdetect-cycle", "Detect an undirected cycle with DFS"],
  ["disjoint-sets%2Funion-find-fundamentals", "Build connectivity with Union-Find"],
  ["disjoint-sets%2Fconnectivity-queries", "Answer dynamic connectivity queries"],
  ["disjoint-sets%2Fcount-components", "Count graph components with Union-Find"],
  ["sorting%2Fbubble-sort", "Sort by bubbling large values right"],
  ["sorting%2Finsertion-sort", "Sort by inserting into a prefix"],
  ["recursion%2Ffactorial", "Compute factorial through recursive calls"],
  ["recursion%2Frecursive-fibonacci", "See repeated work in recursive Fibonacci"],
  ["sorting%2Fmerge-sort", "Sort by dividing and merging"],
  ["sorting%2Fquick-sort", "Partition around a pivot, then recurse"],
  ["backtracking%2Fpermutations", "Generate every permutation with backtracking"],
  ["backtracking%2Fn-queens", "Place queens with constraint search"],
  ["greedy%2Factivity-selection", "Select the largest compatible activity schedule"],
  ["greedy%2Fcoin-change-counterexample", "Challenge greedy coin change"],
  ["dynamic-programming%2Fmemoized-fibonacci", "Replace repeated Fibonacci subtrees with memo hits"],
  ["dynamic-programming%2Fclimbing-stairs", "Count stair paths with a DP transition"],
  ["dynamic-programming%2Fminimum-coins", "Minimize coins with predecessor states"],
  ["bit-manipulation%2Fparity", "Read parity from the lowest bit"],
  ["bit-manipulation%2Fcount-set-bits", "Count ones by clearing the lowest set bit"],
  ["bit-manipulation%2Fsingle-number", "Find the unique value with XOR"]
];

test("landing and studio are accessible, quiet, and free of page overflow", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1, name: "See the algorithm think." })).toBeVisible();
  await expect(page.getByText("Built by Matthew Clark")).toBeVisible();
  await expect(page.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
    "href",
    "https://everdein.github.io/portfolio/"
  );
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);

  await page.goto("./studio/");
  await expect(page.getByRole("heading", { level: 2, name: "Find the largest value" })).toBeVisible();
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);

  expect(errors).toEqual([]);
});

test("every Pip has two visible animated arms and a distinct placement pose", async ({ page }) => {
  for (const [path, expectedCount] of [["./", 3], ["./studio/#lesson=arrays%2Ffind-largest", 2]]) {
    await page.goto(path);
    const pips = page.locator("[data-pip]");
    await expect(pips).toHaveCount(expectedCount);

    const appearances = await pips.evaluateAll((elements) => elements.map((element) => ({
      pose: element.dataset.pipPose,
      arms: [...element.querySelectorAll(".pip-arm")].map((arm) => {
        const style = getComputedStyle(arm);
        return {
          animationName: style.animationName,
          opacity: style.opacity,
          transform: style.transform
        };
      })
    })));

    expect(new Set(appearances.map(({ pose }) => pose)).size).toBe(expectedCount);
    for (const appearance of appearances) {
      expect(appearance.pose).toBeTruthy();
      expect(appearance.arms).toHaveLength(2);
      expect(appearance.arms.map(({ animationName }) => animationName)).toEqual([
        "pip-arm-left",
        "pip-arm-right"
      ]);
      for (const arm of appearance.arms) {
        expect(arm.opacity).toBe("1");
        expect(arm.transform).not.toBe("none");
      }
    }
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reducedMotionArms = await page.locator(".pip-arm").evaluateAll((arms) => arms.map((arm) => {
    const style = getComputedStyle(arm);
    return {
      animationName: style.animationName,
      opacity: style.opacity,
      transform: style.transform
    };
  }));
  for (const arm of reducedMotionArms) {
    expect(arm.animationName).toBe("none");
    expect(arm.opacity).toBe("1");
    expect(arm.transform).not.toBe("none");
  }
});

test("every lesson deep link renders its expected interactive surface", async ({ page }) => {
  const errors = collectPageErrors(page);

  for (const [lessonId, title] of lessons) {
    await page.goto(`./studio/#lesson=${lessonId}`);
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play lesson" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Next →" })).toBeEnabled();
    await expectNoDocumentOverflow(page);
  }

  expect(errors).toEqual([]);
});

test("custom input, validation, stepping, playback, and keyboard controls stay coherent", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");

  const input = page.getByRole("textbox", { name: "Enter 1–12 finite numbers" });
  await input.fill("1,,2");
  await page.getByRole("button", { name: "Apply input" }).click();
  await expect(page.locator("#input-error")).toContainText("Enter a number between each comma");
  await expect(input).toHaveAttribute("aria-invalid", "true");

  await input.fill("-4, 8, 8, 3");
  await input.press("Enter");
  await expect(page.locator("#step-count")).toHaveText("0 / 4");
  await expect(input).toHaveAttribute("aria-invalid", "false");

  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator("#step-count")).toHaveText("1 / 4");

  await page.locator("#lesson-title").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#step-count")).toHaveText("2 / 4");
  await page.keyboard.press("r");
  await expect(page.locator("#step-count")).toHaveText("0 / 4");

  await page.getByRole("button", { name: "Play lesson" }).click();
  await expect(page.getByRole("button", { name: "Pause lesson" })).toBeVisible();
  await page.getByRole("button", { name: "Pause lesson" }).click();
  await expect(page.getByRole("button", { name: "Play lesson" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("a learner can commit a prediction before revealing the next state", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");

  await page.getByRole("textbox", { name: "Your prediction" }).fill("The best value will remain 1 until a larger value appears.");
  await page.getByRole("button", { name: "Lock it in" }).click();
  await expect(page.getByText("You predicted:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reveal next step →" })).toBeVisible();

  await page.getByRole("button", { name: "Reveal next step →" }).click();
  await expect(page.getByRole("status")).toContainText("compare your prediction");
  await expect(page.locator("#step-count")).toHaveText("1 / 5");
});

test("landing catalog groups every manifest lesson under accessible topic navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const expectedTopics = [...new Set(curriculumLessons.map(({ topic }) => topic))];
  const navigation = page.getByRole("navigation", { name: "Curriculum topics" });
  const topicLinks = navigation.getByRole("link");
  const topicSections = page.locator(".home-lesson-topic");

  await expect(topicLinks).toHaveCount(expectedTopics.length);
  await expect(topicSections).toHaveCount(expectedTopics.length);
  await expect(page.locator(".home-lesson-card")).toHaveCount(curriculumLessons.length);
  await expect(topicLinks.first()).toHaveAccessibleName("Arrays, 7 lessons");

  const rendered = await topicSections.evaluateAll((sections) => sections.map((section) => ({
    topic: section.querySelector("h3")?.textContent,
    lessonHrefs: [...section.querySelectorAll(".home-lesson-card")]
      .map((card) => card.getAttribute("href"))
  })));
  assertCatalogMatchesManifest(rendered);

  await topicLinks.first().focus();
  await expect(topicLinks.first()).toBeFocused();
  await topicLinks.first().press("Enter");
  await expect(page).toHaveURL(/#curriculum-topic-arrays$/);
  await expect(page.locator("#curriculum-topic-arrays")).toHaveAttribute(
    "aria-labelledby",
    "curriculum-topic-arrays-title"
  );
});

test("studio catalog groups every lesson by topic while preserving lesson numbers", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");

  const expectedTopics = [...new Set(curriculumLessons.map(({ topic }) => topic))];
  const groups = page.locator(".lesson-topic-group");
  await expect(groups).toHaveCount(expectedTopics.length);
  await expect(page.locator("#lesson-list .lesson-card")).toHaveCount(curriculumLessons.length);
  await expect(groups.first().getByRole("heading", { name: "Arrays" })).toBeVisible();
  await expect(groups.first().locator(".lesson-card-number").first()).toHaveText("L01");
  await expect(groups.first().locator(".lesson-card-number").last()).toHaveText("L15");
  await expect(groups.first()).toHaveClass(/is-current/);

  const renderedTopics = await groups.evaluateAll((sections) => sections.map((section) => ({
    topic: section.querySelector("h3")?.textContent,
    lessons: [...section.querySelectorAll(".lesson-card")].map((card) => card.dataset.lessonId)
  })));
  expect(renderedTopics.map(({ topic }) => topic)).toEqual(expectedTopics);
  for (const group of renderedTopics) {
    expect(group.lessons).toEqual(
      curriculumLessons.filter(({ topic }) => topic === group.topic).map(({ id }) => id)
    );
  }
});

test("the sequence renderer supports custom text and accessible stepping", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./studio/#lesson=strings%2Fvalid-palindrome");

  const input = page.getByRole("textbox", { name: /Enter 1.*48 characters/ });
  await input.fill("No 'x' in Nixon");
  await page.getByRole("button", { name: "Apply input" }).click();
  await expect(page.getByRole("region", { name: "Scrollable character sequence visualization" })).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator("#step-count")).toContainText("1 /");
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
  expect(errors).toEqual([]);
});

function collectPageErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

async function expectNoDocumentOverflow(page) {
  const hasOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  ));
  expect(hasOverflow).toBe(false);
}

async function expectNoSeriousAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(serious, formatViolations(serious)).toEqual([]);
}

function formatViolations(violations) {
  return violations.map((violation) => {
    const targets = violation.nodes.flatMap((node) => node.target).join(", ");
    return `${violation.id}: ${violation.help} (${targets})`;
  }).join("\n");
}

function assertCatalogMatchesManifest(rendered) {
  const expectedTopics = [...new Set(curriculumLessons.map(({ topic }) => topic))];
  expect(rendered.map(({ topic }) => topic)).toEqual(expectedTopics);

  for (const group of rendered) {
    const expectedHrefs = curriculumLessons
      .filter(({ topic }) => topic === group.topic)
      .map(({ id }) => `./studio/#lesson=${encodeURIComponent(id)}`);
    expect(group.lessonHrefs).toEqual(expectedHrefs);
  }
}
