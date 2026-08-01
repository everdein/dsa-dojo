import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const lessons = [
  ["arrays%2Ffind-largest", "Find the largest value"],
  ["arrays%2Fsliding-window", "Find the best fixed window"],
  ["arrays%2Freverse-array", "Reverse an array in pairs"],
  ["arrays%2Fmove-zeros", "Move zeros to the end"],
  ["linked-lists%2Ftraverse-linked-list", "Traverse a linked list"],
  ["linked-lists%2Freverse-linked-list", "Reverse a linked list"],
  ["linked-lists%2Fdetect-cycle", "Detect a cycle with two speeds"]
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
