#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs")).sort();

let fixed = 0;
let skipped = 0;

console.log(`Processing ${lessonFiles.length} lesson files...\n`);

for (const lessonFile of lessonFiles) {
  const lessonPath = path.join(lessonsDir, lessonFile);
  let lessonContent = fs.readFileSync(lessonPath, "utf8");

  // Extract sourcePath
  const sourcePathMatch = lessonContent.match(/sourcePath:\s*"([^"]+)"/);
  if (!sourcePathMatch) {
    skipped++;
    continue;
  }

  const sourcePath = sourcePathMatch[1];
  const sourceFile = path.join(projectRoot, sourcePath);

  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  ${lessonFile}: source file not found`);
    skipped++;
    continue;
  }

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Extract existing lines
  const linesMatch = lessonContent.match(/lines:\s*\[\s*([\s\S]*?)\n\s*\]/);
  if (!linesMatch) {
    skipped++;
    continue;
  }

  const linesText = linesMatch[1];
  const lineObjects = Array.from(linesText.matchAll(
    /\{\s*number:\s*(\d+),\s*text:\s*"((?:[^"\\]|\\.)*)",\s*steps:\s*(\[[^\]]*\])\s*\}/g
  ));

  if (lineObjects.length === 0) {
    skipped++;
    continue;
  }

  // Check if first line text matches any line in source
  const firstText = lineObjects[0][2];
  const firstMatch = sourceLines.findIndex(line => line === firstText);

  if (firstMatch === -1) {
    // Line not found, need to fix it
    // Find main export function
    let funcStart = -1;
    for (let i = 0; i < sourceLines.length; i++) {
      const match = sourceLines[i].match(/^export\s+(?:function|const|class|async\s+function)\s+\w+/);
      if (match) {
        funcStart = i;
        break;
      }
    }

    if (funcStart === -1) {
      console.log(`⚠️  ${lessonFile}: no export function found`);
      skipped++;
      continue;
    }

    // Find end of function
    let funcEnd = funcStart;
    let braceCount = 0;
    let foundOpen = false;
    for (let i = funcStart; i < sourceLines.length; i++) {
      for (const char of sourceLines[i]) {
        if (char === "{") {
          braceCount++;
          foundOpen = true;
        } else if (char === "}") {
          braceCount--;
          if (foundOpen && braceCount === 0) {
            funcEnd = i;
            break;
          }
        }
      }
      if (foundOpen && braceCount === 0) break;
    }

    // Extract function lines
    const funcLines = [];
    for (let i = funcStart; i <= funcEnd && i < sourceLines.length; i++) {
      funcLines.push({
        number: i + 1,
        text: sourceLines[i]
      });
    }

    // Build new lines array, preserving steps
    const newLineObjects = [];
    for (let i = 0; i < funcLines.length && i < lineObjects.length; i++) {
      const { number, text } = funcLines[i];
      const steps = lineObjects[i][3];
      const escaped = text.replace(/"/g, '\\"');
      newLineObjects.push(
        `{ number: ${number}, text: "${escaped}", steps: ${steps} }`
      );
    }

    // For extra function lines beyond original, add with empty steps
    for (let i = lineObjects.length; i < funcLines.length; i++) {
      const { number, text } = funcLines[i];
      const escaped = text.replace(/"/g, '\\"');
      newLineObjects.push(
        `{ number: ${number}, text: "${escaped}", steps: [] }`
      );
    }

    const newLinesArray = `lines: [\n      ${newLineObjects.join(",\n      ")}\n    ]`;
    const updated = lessonContent.replace(
      /lines:\s*\[\s*[\s\S]*?\n\s*\]/,
      newLinesArray
    );

    fs.writeFileSync(lessonPath, updated, "utf8");
    console.log(`✅ ${lessonFile} (lines ${funcStart + 1}-${funcEnd + 1})`);
    fixed++;
  } else {
    // Lines already match, skip
    skipped++;
  }
}

console.log(`\n📊 Summary: ${fixed} fixed, ${skipped} already correct or skipped`);
