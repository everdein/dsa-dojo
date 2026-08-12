import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");

// Get all lesson files
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs"));

let fixed = 0;
let skipped = 0;

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
    skipped++;
    continue;
  }

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Find the first export function in the source
  let mainFuncStart = -1;
  let mainFuncName = "";
  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i];
    const match = line.match(/^export\s+(function|const|class|async\s+function)\s+(\w+)/);
    if (match) {
      mainFuncStart = i + 1; // 1-based line number
      mainFuncName = match[2];
      break;
    }
  }

  if (mainFuncStart === -1) {
    skipped++;
    continue;
  }

  // Find the closing brace
  let mainFuncEnd = mainFuncStart;
  let braceCount = 0;
  let foundStart = false;
  for (let i = mainFuncStart - 1; i < sourceLines.length; i++) {
    const line = sourceLines[i];
    for (const char of line) {
      if (char === "{") {
        braceCount++;
        foundStart = true;
      } else if (char === "}") {
        braceCount--;
        if (foundStart && braceCount === 0) {
          mainFuncEnd = i + 1;
          break;
        }
      }
    }
    if (foundStart && braceCount === 0) break;
  }

  // Extract the function lines for the lesson
  const functionLines = [];
  for (let i = mainFuncStart - 1; i < mainFuncEnd && i < sourceLines.length; i++) {
    const lineNum = i + 1;
    const text = sourceLines[i];
    functionLines.push({ lineNum, text });
  }

  // Find the lines array in the lesson
  const linesArrayRegex = /lines:\s*\[\s*([^\[\]]*\{[^}]*\}[^\[\]]*)\s*\]/s;
  const match = lessonContent.match(linesArrayRegex);
  if (!match) {
    skipped++;
    continue;
  }

  const oldLinesArray = match[0];
  const linesContent = match[1];

  // Extract steps from old lines
  const lineObjectMatches = linesContent.matchAll(/\{[^}]*steps:\s*(\[[^\]]*\])[^}]*\}/g);
  const oldSteps = [];
  for (const m of lineObjectMatches) {
    oldSteps.push(m[1]);
  }

  // Build new lines array, reusing steps as much as possible
  const newLineObjects = [];
  for (let i = 0; i < functionLines.length; i++) {
    const { lineNum, text } = functionLines[i];
    const steps = oldSteps[i] || "[]";
    const escapedText = text.replace(/"/g, '\\"');
    newLineObjects.push(
      `{ number: ${lineNum}, text: "${escapedText}", steps: ${steps} }`
    );
  }

  const newLinesArray = `lines: [\n      ${newLineObjects.join(",\n      ")}\n    ]`;
  const updatedContent = lessonContent.replace(oldLinesArray, newLinesArray);

  fs.writeFileSync(lessonPath, updatedContent, "utf8");
  console.log(
    `✅ ${lessonFile}: lines ${mainFuncStart}-${mainFuncEnd} (${mainFuncName})`
  );
  fixed++;
}

console.log(
  `\n📊 Summary: ${fixed} fixed, ${skipped} skipped out of ${lessonFiles.length}`
);
