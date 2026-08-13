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
      headbands: element.querySelectorAll(".pip-headband").length,
      tails: element.querySelectorAll(".pip-headband-tail").length,
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
      expect(appearance.headbands).toBe(1);
      expect(appearance.tails).toBe(2);
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

test("lesson Pip responds to prediction, insight, validation, and completion moments", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");

  const avatar = page.locator(".pip-card .pip-avatar");
  const emotion = page.locator("#pip-emotion-label");
  const senseiLine = page.locator("#pip-sensei-line");
  await expect(avatar).toHaveAttribute("data-state", "curious");
  await expect(emotion).toHaveText("Curious");
  await expect(senseiLine).toHaveText("First, observe without rushing.");

  const values = page.locator('[data-field-id="values"]');
  await values.fill("4, 1, 7, 3");
  await page.locator("#apply-button").click();
  await page.locator("#prediction-input").fill("The best stays 4 until 7 appears.");
  await page.locator("#prediction-form button[type=submit]").click();
  await expect(avatar).toHaveAttribute("data-state", "thinking");
  await expect(emotion).toHaveText("Thinking");
  await expect(senseiLine).toHaveText("Pause. Name what must remain true.");

  await page.locator("#next-button").click();
  await expect(avatar).toHaveAttribute("data-state", "encouraging");
  await expect(emotion).toHaveText("You’ve got this");

  await page.locator("#next-button").click();
  await expect(avatar).toHaveAttribute("data-state", "aha");
  await expect(emotion).toHaveText("Aha!");

  await values.fill("1,,2");
  await page.locator("#apply-button").click();
  await expect(avatar).toHaveAttribute("data-state", "caution");
  await expect(emotion).toHaveText("Let’s check that");

  await values.fill("4, 1, 7, 3");
  await page.locator("#apply-button").click();
  await page.locator("#prediction-input").fill("Seven should win.");
  await page.locator("#prediction-form button[type=submit]").click();
  for (let step = 0; step < 4; step += 1) {
    await page.locator("#next-button").click();
  }
  await expect(avatar).toHaveAttribute("data-state", "celebrating");
  await expect(emotion).toHaveText("Celebrating");
  await expect(senseiLine).toHaveText("A clear explanation is the real victory.");
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

test("Challenge Mode gates each reveal, scores predictions, and remembers a personal best", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");
  await page.locator("#challenge-toggle").click();

  await expect(page.locator("#challenge-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#challenge-card")).toBeVisible();
  await expect(page.getByRole("button", { name: "Autoplay unavailable in Challenge Mode" })).toBeDisabled();
  await expect(page.locator("#prediction-checkpoint")).toBeHidden();
  await expect(page.locator("#next-button")).toBeDisabled();
  await expect(page.locator('.challenge-option input[type="radio"]')).toHaveCount(3);
  await expectNoSeriousAccessibilityViolations(page);

  const correctOutcomes = [
    /2 becomes the new largest value/,
    /3 becomes the new largest value/,
    /4 becomes the new largest value/,
    /5 becomes the new largest value/,
    /scan is complete.*5 is the largest value/i
  ];
  for (let index = 0; index < correctOutcomes.length; index += 1) {
    await page.locator(".challenge-option", { hasText: correctOutcomes[index] }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.locator("#challenge-feedback-label")).toHaveText("CORRECT");
    await expect(page.locator("#challenge-score")).toHaveText(`${index + 1} / ${index + 1}`);
    await page.locator("#next-button").click();
  }

  await expect(page.locator("#step-count")).toHaveText("5 / 5");
  await expect(page.locator("#challenge-title")).toHaveText("Challenge complete.");
  await expect(page.locator("#challenge-best")).toHaveText("5 / 5");

  await page.reload();
  await expect(page.locator("#challenge-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#challenge-best")).toHaveText("5 / 5");
  await expect(page.locator("#step-count")).toHaveText("0 / 5");

  await page.locator("#challenge-toggle").click();
  await expect(page.locator("#challenge-card")).toBeHidden();
  await expect(page.getByRole("button", { name: "Play lesson" })).toBeEnabled();
  await expect(page.locator("#prediction-checkpoint")).toBeVisible();
});

test("Algorithm Comparison Mode synchronizes compatible lessons without hiding their tradeoffs", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("./studio/#lesson=sorting%2Fbubble-sort");
  await page.getByRole("button", { name: /Compare Bubble Sort/ }).click();

  const workspace = page.locator("#comparison-workspace");
  await expect(workspace).toBeVisible();
  await expect(page.locator("#lesson-grid")).toBeHidden();
  await expect(page.locator("#challenge-toggle")).toBeHidden();
  await expect(page.locator("#comparison-family")).toHaveValue("sorting-strategies");
  await expect(page.getByLabel("Left algorithm")).toHaveValue("sorting/bubble-sort");
  await expect(page.getByLabel("Right algorithm")).toHaveValue("sorting/merge-sort");
  await expect(page.locator("#comparison-result")).toContainText("Same result");
  await expect(page.locator("#comparison-result")).toContainText("17 vs 29 recorded transitions");
  await expect(page.locator("[data-comparison-side=left]")).toContainText("O(n²) time");
  await expect(page.locator("[data-comparison-side=right]")).toContainText("O(n log n) time");

  await page.getByRole("button", { name: "Left forward →" }).click();
  await expect(page.locator("#comparison-left-step")).toHaveText("1 / 17");
  await expect(page.locator("#comparison-right-step")).toHaveText("0 / 29");
  await page.getByRole("button", { name: "Next beat →" }).click();
  await expect(page.locator("#comparison-left-step")).toHaveText("2 / 17");
  await expect(page.locator("#comparison-right-step")).toHaveText("1 / 29");
  await page.getByRole("button", { name: "Play comparison" }).click();
  await expect(page.getByRole("button", { name: "Pause comparison" })).toBeVisible();
  await page.getByRole("button", { name: "Pause comparison" }).click();

  await page.locator("#comparison-family").selectOption("fibonacci-strategies");
  await expect(page.getByLabel("Left algorithm")).toHaveValue("recursion/recursive-fibonacci");
  await expect(page.getByLabel("Right algorithm")).toHaveValue("dynamic-programming/memoized-fibonacci");
  await expect(page.locator("#comparison-result")).toContainText("Same result");
  await expect(page.locator("[data-comparison-side=left]")).toContainText("O(2^n) time");
  await expect(page.locator("[data-comparison-side=right]")).toContainText("O(n) time");

  const sharedInput = page.getByLabel("Shared Fibonacci input (0-6)");
  await sharedInput.fill("3");
  await page.getByRole("button", { name: "Apply shared input" }).click();
  await expect(page.locator("#comparison-result")).toContainText("2");
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
  expect(errors).toEqual([]);
});

test("share links restore exact lesson and comparison states without local scores", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");
  await page.locator('[data-field-id="values"]').fill("4, 1, 9, 3");
  await page.getByRole("button", { name: "Apply input" }).click();
  await page.locator("#next-button").click();
  await page.locator("#next-button").click();
  await page.getByRole("button", { name: "Share this state" }).click();
  await expect(page.locator("#share-state-status")).toHaveText("Link copied — input and step included.");
  const lessonUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(lessonUrl).toMatch(/share=.*#lesson=arrays%2Ffind-largest$/);

  await page.goto(lessonUrl);
  await expect(page.locator('[data-field-id="values"]')).toHaveValue("4, 1, 9, 3");
  await expect(page.locator("#step-count")).toHaveText(/2 \/ \d+/);
  await expect(page.locator("#share-state-status")).toHaveText("Shared input and step restored.");
  await expect(page.locator("#challenge-toggle-status")).toHaveText("Off");

  await page.getByRole("button", { name: "Compare algorithms" }).click();
  await page.locator('[data-comparison-field="values"]').fill("8, 3, 5, 1");
  await page.getByRole("button", { name: "Apply shared input" }).click();
  await page.getByRole("button", { name: "Left forward →" }).click();
  await page.getByRole("button", { name: "Next beat →" }).click();
  await page.getByRole("button", { name: "Share this state" }).click();
  const comparisonUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(comparisonUrl).toMatch(/share=.*#comparison$/);

  await page.goto(comparisonUrl);
  await expect(page.locator("#comparison-workspace")).toBeVisible();
  await expect(page.locator('[data-comparison-field="values"]')).toHaveValue("8, 3, 5, 1");
  await expect(page.locator("#comparison-left-step")).toHaveText(/2 \/ \d+/);
  await expect(page.locator("#comparison-right-step")).toHaveText(/1 \/ \d+/);
  await expect(page.locator("#share-state-status")).toHaveText("Shared comparison restored.");
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
});

test("malformed share links fail safely and leave a usable default lesson", async ({ page }) => {
  await page.goto("./studio/?share=not_valid!#lesson=arrays%2Ffind-largest");
  await expect(page.locator("#share-state-notice")).toBeVisible();
  await expect(page.locator("#share-state-notice")).toContainText("invalid format");
  await expect(page.getByRole("heading", { level: 2, name: "Find the largest value" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.locator("#share-state-notice")).toBeHidden();
  await expect(page).not.toHaveURL(/share=/);
});

test("learning progress survives reloads, appears across pages, and can be reset", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");
  const values = page.locator('[data-field-id="values"]');
  await values.fill("4, 1, 7, 3");
  await page.locator("#apply-button").click();
  await page.locator("#next-button").click();
  await page.locator("#next-button").click();
  await expect(page.locator("#step-count")).toHaveText("2 / 4");

  await page.reload();
  await expect(values).toHaveValue("4, 1, 7, 3");
  await expect(page.locator("#step-count")).toHaveText("2 / 4");
  await expect(page.locator('[data-lesson-id="arrays/find-largest"] .lesson-card-progress')).toHaveText("Step 2 of 4");

  await page.locator("#next-button").click();
  await page.locator("#next-button").click();
  await expect(page.locator("#progress-summary")).toContainText("1 of 55 lessons complete");
  await expect(page.locator('[data-lesson-id="arrays/find-largest"]')).toHaveAttribute("data-progress", "complete");

  await page.goto("./");
  await expect(page.locator("#home-progress-summary")).toContainText("1 of 55 lessons complete");
  await expect(page.locator('.home-lesson-card[href*="find-largest"]')).toHaveAttribute("data-progress", "complete");
  await expect(page.locator("#home-progress-continue")).toContainText("Continue Find Largest");

  await page.goto("./studio/");
  await expect(page.locator("#step-count")).toHaveText("4 / 4");
  await page.locator("#reset-progress-button").click();
  await expect(page.locator("#progress-reset-confirmation")).toBeVisible();
  await page.locator("#confirm-reset-progress-button").click();
  await expect(page.locator("#progress-summary")).toContainText("0 of 55 lessons complete");
  await expect(page.locator('[data-lesson-id="arrays/find-largest"]')).not.toHaveAttribute("data-progress", "complete");
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

test("learning map exposes prerequisite paths, pattern highlights, progress, and lesson entry", async ({ page }) => {
  await page.goto("./studio/#lesson=arrays%2Ffind-largest");
  await page.getByRole("button", { name: "Learning map" }).click();

  const expectedEdges = curriculumLessons.reduce((total, lesson) => total + lesson.prerequisites.length, 0);
  await expect(page.locator(".curriculum-map-node")).toHaveCount(curriculumLessons.length);
  await expect(page.locator(".curriculum-map-edge")).toHaveCount(expectedEdges);
  await expect(page.locator('[data-map-lesson-id="arrays/find-largest"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-map-lesson-id="arrays/find-largest"]')).toHaveAttribute("data-progress", "visited");

  await page.locator('[data-map-lesson-id="queues/sliding-window-maximum"]').click();
  await expect(page.locator("#curriculum-map-detail")).toContainText("Sliding Window Maximum");
  await expect(page.locator("#curriculum-map-detail")).toContainText("L02 Sliding Window");
  await expect(page.locator("#curriculum-map-detail")).toContainText("L20 Queue Operations");
  await expect(page.locator(".curriculum-map-node.is-prerequisite")).toHaveCount(2);
  await expect(page.locator(".curriculum-map-edge.is-active")).toHaveCount(2);

  await page.locator("#curriculum-map-pattern").selectOption("sliding-window");
  await expect(page.locator('[data-map-lesson-id="arrays/sliding-window"]')).not.toHaveClass(/is-dimmed/);
  await expect(page.locator('[data-map-lesson-id="queues/queue-operations"]')).not.toHaveClass(/is-dimmed/);
  expect(await page.locator(".curriculum-map-node.is-dimmed").count()).toBeGreaterThan(40);

  await page.getByRole("button", { name: "Open lesson →" }).click();
  await expect(page).toHaveURL(/lesson=queues%2Fsliding-window-maximum/);
  await expect(page.getByRole("heading", { level: 2, name: "Emit every window maximum" })).toBeVisible();
  await expectNoDocumentOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
});

test("catalog search and filters compose, persist in the URL, and recover from empty results", async ({ page }) => {
  await page.goto("./studio/#catalog");
  const search = page.locator("#catalog-search");
  await search.fill("L24");
  await expect(page.locator(".lesson-card:visible")).toHaveCount(1);
  await expect(page.locator(".lesson-card:visible")).toContainText("Binary Search");
  await expect(page.locator("#catalog-results-summary")).toHaveText("Showing 1 of 55 lessons.");
  await expect(page).toHaveURL(/q=L24/);

  await page.locator("#catalog-progress-filter").selectOption("complete");
  await expect(page.locator("#catalog-empty")).toBeVisible();
  await expect(page.locator(".lesson-card:visible")).toHaveCount(0);
  await page.reload();
  await expect(search).toHaveValue("L24");
  await expect(page.locator("#catalog-progress-filter")).toHaveValue("complete");
  await expect(page.locator("#catalog-empty")).toBeVisible();

  await page.locator("#catalog-empty-clear").click();
  await expect(page.locator(".lesson-card:visible")).toHaveCount(55);
  await expect(page.locator("#catalog-results-summary")).toHaveText("Showing all 55 lessons.");
  await expect(page).not.toHaveURL(/q=|progress=/);

  await page.goto("./");
  const homeSearch = page.locator("#home-catalog-search");
  await homeSearch.fill("shortest path");
  await page.locator("#home-topic-filter").selectOption("Graphs");
  await expect(page.locator(".home-lesson-card:visible")).toHaveCount(1);
  await expect(page.locator(".home-lesson-card:visible")).toContainText("Unweighted Shortest Path");
  await expect(page.locator("#home-filter-summary")).toHaveText("Showing 1 of 55 lessons.");
  await expect(page.locator("#home-topic-nav li:visible")).toHaveCount(1);

  await page.locator("#home-pattern-filter").selectOption("depth-first-search");
  await expect(page.locator("#home-filter-empty")).toBeVisible();
  await page.locator("#home-empty-clear").click();
  await expect(page.locator(".home-lesson-card:visible")).toHaveCount(55);
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
