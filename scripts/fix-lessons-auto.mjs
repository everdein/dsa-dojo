#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs"));

let fixed = 0;
let errors = [];

for (const lessonFile of lessonFiles) {
  const lessonPath = path.join(lessonsDir, lessonFile);
  const lessonContent = fs.readFileSync(lessonPath, "utf8");

  // Extract sourcePath
  const sourcePathMatch = lessonContent.match(/sourcePath:\s*"([^"]+)"/);
  if (!sourcePathMatch) continue;

  const sourcePath = sourcePathMatch[1];
  const sourceFile = path.join(projectRoot, sourcePath);

  if (!fs.existsSync(sourceFile)) {
    errors.push(`${lessonFile}: source not found`);
    continue;
  }

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Find the first export function/const/class
  let funcStart = -1;
  let funcName = "";
  for (let i = 0; i < sourceLines.length; i++) {
    const match = sourceLines[i].match(/^export\s+(?:function|const|class|async\s+function)\s+(\w+)/);
    if (match) {
      funcStart = i + 1; // 1-based
      funcName = match[1];
      break;
    }
  }

  if (funcStart === -1) {
    errors.push(`${lessonFile}: no export found`);
    continue;
  }

  // Find end of function (matching braces)
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

  // Extract steps from lesson
  const stepsMatches = Array.from(lessonContent.matchAll(/steps:\s*(\[[^\]]*\])/g));
  const steps = stepsMatches.map(m => m[1]);

  // Build new lines array
  let newLines = "";
  for (let i = 0; i < funcLines.length && i < steps.length; i++) {
    const { number, text } = funcLines[i];
    const escaped = text.replace(/"/g, '\\"');
    if (i > 0) newLines += ",\n      ";
    newLines += `{ number: ${number}, text: "${escaped}", steps: ${steps[i]} }`;
  }

  // For extra lines beyond steps, add without steps
  for (let i = steps.length; i < funcLines.length; i++) {
    const { number, text } = funcLines[i];
    const escaped = text.replace(/"/g, '\\"');
    newLines += `,\n      { number: ${number}, text: "${escaped}", steps: [] }`;
  }

  const newLinesArray = `lines: [\n      ${newLines}\n    ]`;

  // Replace in content
  const updated = lessonContent.replace(
    /lines:\s*\[\s*\{[\s\S]*?\n\s*\]/,
    newLinesArray
  );

  if (updated === lessonContent) {
    errors.push(`${lessonFile}: no replacement`);
    continue;
  }

  fs.writeFileSync(lessonPath, updated, "utf8");
  console.log(`✅ ${lessonFile} (lines ${funcStart}-${funcEnd})`);
  fixed++;
}

console.log(`\n📊 Summary: ${fixed} fixed, ${errors.length} errors`);
if (errors.length > 0) {
  console.log("\nErrors:");
  errors.forEach(e => console.log(`  - ${e}`));
}
