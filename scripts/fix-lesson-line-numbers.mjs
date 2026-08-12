import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
const algorithmDirs = [
  "arrays",
  "backtracking",
  "bit-manipulation",
  "disjoint-sets",
  "dynamic-programming",
  "graphs",
  "greedy",
  "hash-maps-and-sets",
  "heaps-and-priority-queues",
  "linked-lists",
  "matrices",
  "patterns",
  "queues",
  "recursion",
  "searching",
  "sorting",
  "stacks",
  "strings",
  "trees",
  "tries"
];

// Get all lesson files
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs"));

let fixed = 0;
let skipped = 0;
let failed = 0;

for (const lessonFile of lessonFiles) {
  const lessonPath = path.join(lessonsDir, lessonFile);
  let lessonContent = fs.readFileSync(lessonPath, "utf8");

  // Find the sourcePath in the lesson
  const sourcePathMatch = lessonContent.match(/sourcePath:\s*"([^"]+)"/);
  if (!sourcePathMatch) {
    skipped++;
    continue;
  }

  const sourcePath = sourcePathMatch[1];
  const sourceFile = path.join(projectRoot, sourcePath);

  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  Source file not found: ${sourcePath}`);
    skipped++;
    continue;
  }

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Find all export functions in the source
  const exportFuncs = [];
  sourceLines.forEach((line, idx) => {
    const match = line.match(/^export\s+(function|const|class|async\s+function)\s+(\w+)/);
    if (match) {
      exportFuncs.push({ name: match[2], lineNum: idx + 1, line });
    }
  });

  if (exportFuncs.length === 0) {
    console.log(`⚠️  No export functions found in ${sourcePath}`);
    skipped++;
    continue;
  }

  // Find the main function (usually the first one, or named after the file)
  const fileName = path.basename(sourcePath, ".mjs");
  let mainFunc = null;

  // Try to match by name first
  mainFunc = exportFuncs.find(f => 
    f.name.toLowerCase() === fileName.toLowerCase() ||
    f.name.toLowerCase() === camelCaseFromKebab(fileName).toLowerCase()
  );

  // If not found, use the last export (usually the main algorithm)
  if (!mainFunc) {
    mainFunc = exportFuncs[exportFuncs.length - 1];
  }

  if (!mainFunc) {
    console.log(`⚠️  Could not identify main function in ${sourcePath}`);
    skipped++;
    continue;
  }

  // Extract the function body - find closing brace at same indent level
  let functionEndLine = mainFunc.lineNum;
  let braceCount = 0;
  let foundStart = false;

  for (let i = mainFunc.lineNum - 1; i < sourceLines.length; i++) {
    const line = sourceLines[i];
    for (const char of line) {
      if (char === "{") {
        braceCount++;
        foundStart = true;
      } else if (char === "}") {
        braceCount--;
        if (foundStart && braceCount === 0) {
          functionEndLine = i + 1;
          break;
        }
      }
    }
    if (foundStart && braceCount === 0) break;
  }

  // Extract function lines (skip blank lines and internal calls)
  const functionLines = [];
  for (let i = mainFunc.lineNum - 1; i < functionEndLine && i < sourceLines.length; i++) {
    const line = sourceLines[i];
    const lineNum = i + 1;
    functionLines.push({ number: lineNum, text: line });
  }

  // Build the new lines array for the lesson
  const newLinesArray = functionLines
    .map(({ number, text }) => `      { number: ${number}, text: "${escapeQuotes(text)}", steps: [...] }`)
    .join(",\n");

  // Find and replace the lines array in the lesson
  const linesArrayRegex = /lines:\s*\[\s*[^[\]]*\{[^}]*\}[^[\]]*\]/s;
  const linesArrayMatch = lessonContent.match(linesArrayRegex);

  if (!linesArrayMatch) {
    console.log(`⚠️  Could not find lines array in ${lessonFile}`);
    failed++;
    continue;
  }

  // For now, just update the line numbers and keep the steps
  // We'll preserve the steps array as-is and only fix line numbers and text
  const oldLinesArray = linesArrayMatch[0];
  const lineObjects = lessonContent.match(/\{\s*number:\s*\d+,\s*text:\s*"[^"]*",\s*steps:\s*\[[^\]]*\]\s*\}/g);

  if (!lineObjects) {
    console.log(`⚠️  Could not parse line objects in ${lessonFile}`);
    failed++;
    continue;
  }

  // Build new line objects preserving steps
  const newLineObjects = [];
  for (let i = 0; i < lineObjects.length && i < functionLines.length; i++) {
    const oldObj = lineObjects[i];
    const stepsMatch = oldObj.match(/steps:\s*\[([^\]]*)\]/);
    const steps = stepsMatch ? stepsMatch[1] : "";
    const { number, text } = functionLines[i];
    newLineObjects.push(
      `{ number: ${number}, text: "${escapeQuotes(text)}", steps: [${steps}] }`
    );
  }

  const newLinesArray = `lines: [\n      ${newLineObjects.join(",\n      ")}\n    ]`;
  lessonContent = lessonContent.replace(linesArrayRegex, newLinesArray);

  fs.writeFileSync(lessonPath, lessonContent, "utf8");
  console.log(
    `✅ Fixed ${lessonFile}: lines ${mainFunc.lineNum}-${functionEndLine}`
  );
  fixed++;
}

console.log(`\n📊 Summary: ${fixed} fixed, ${skipped} skipped, ${failed} failed`);

function escapeQuotes(str) {
  return str.replace(/"/g, '\\"');
}

function camelCaseFromKebab(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
