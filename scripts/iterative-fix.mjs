#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
let fixCount = 0;

async function runTest() {
  try {
    execSync("npm test", { cwd: projectRoot, stdio: "pipe" });
    return "";
  } catch (e) {
    return e.stdout.toString() + e.stderr.toString();
  }
}

function extractFailingLesson(output) {
  const match = output.match(/(\w+-\w+(?:-\w+)*)\s+source line/);
  return match ? match[1] : null;
}

async function fixLesson(lessonId) {
  // Find the lesson file
  const files = fs.readdirSync(lessonsDir);
  const lessonFile = files.find(f => {
    const content = fs.readFileSync(path.join(lessonsDir, f), "utf8");
    return content.includes(`id: "${lessonId}"`);
  });

  if (!lessonFile) return false;

  const lessonPath = path.join(lessonsDir, lessonFile);
  let lessonContent = fs.readFileSync(lessonPath, "utf8");

  // Extract sourcePath
  const sourcePathMatch = lessonContent.match(/sourcePath:\s*"([^"]+)"/);
  if (!sourcePathMatch) return false;

  const sourcePath = sourcePathMatch[1];
  const sourceFile = path.join(projectRoot, sourcePath);

  if (!fs.existsSync(sourceFile)) return false;

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Find main export function
  let funcStart = -1;
  for (let i = 0; i < sourceLines.length; i++) {
    const match = sourceLines[i].match(/^export\s+(?:function|const|class|async\s+function)\s+\w+/);
    if (match) {
      funcStart = i + 1;
      break;
    }
  }

  if (funcStart === -1) return false;

  // Find end of function
  let funcEnd = funcStart;
  let braceCount = 0;
  let foundOpen = false;
  for (let i = funcStart - 1; i < sourceLines.length; i++) {
    for (const char of sourceLines[i]) {
      if (char === "{") {
        braceCount++;
        foundOpen = true;
      } else if (char === "}") {
        braceCount--;
        if (foundOpen && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }
    if (foundOpen && braceCount === 0) break;
  }

  // Extract function lines
  const funcLines = [];
  for (let i = funcStart - 1; i < funcEnd && i < sourceLines.length; i++) {
    funcLines.push({
      number: i + 1,
      text: sourceLines[i]
    });
  }

  // Get current steps
  const stepsMatches = Array.from(lessonContent.matchAll(/steps:\s*(\[[^\]]*\])/g));
  const steps = stepsMatches.map(m => m[1]);

  // Build new lines (use steps from existing or create empty)
  const newLineObjects = [];
  for (let i = 0; i < funcLines.length; i++) {
    const { number, text } = funcLines[i];
    const escaped = text.replace(/"/g, '\\"');
    const stepsList = steps[i] || "[]";
    newLineObjects.push(
      `{ number: ${number}, text: "${escaped}", steps: ${stepsList} }`
    );
  }

  const newLinesArray = `lines: [\n      ${newLineObjects.join(",\n      ")}\n    ]`;
  const updated = lessonContent.replace(
    /lines:\s*\[\s*[\s\S]*?\n\s*\]/,
    newLinesArray
  );

  if (updated === lessonContent) return false;

  fs.writeFileSync(lessonPath, updated, "utf8");
  console.log(`✅ Fixed ${lessonFile} (lines ${funcStart}-${funcEnd})`);
  return true;
}

async function main() {
  console.log("🔄 Starting iterative lesson fixing...\n");

  while (fixCount < 50) {
    console.log(`Run ${fixCount + 1}...`);
    const output = await runTest();

    if (output.includes("pass 450")) {
      console.log("✅ All tests pass!");
      break;
    }

    const failingLesson = extractFailingLesson(output);
    if (!failingLesson) {
      console.log("❌ Could not extract failing lesson");
      break;
    }

    console.log(`📍 Failing lesson: ${failingLesson}`);
    const fixed = await fixLesson(failingLesson);

    if (!fixed) {
      console.log(`❌ Could not fix ${failingLesson}`);
      break;
    }

    fixCount++;
    console.log();
  }

  console.log(`\n📊 Total fixed: ${fixCount}`);
}

main().catch(console.error);
