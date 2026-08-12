#!/usr/bin/env node
/**
 * Smart lesson line mapper: for each line in a lesson, finds where it actually appears
 * in the source file and updates the line number if needed.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs")).sort();

let fixed = 0;
let errors = [];

for (const lessonFile of lessonFiles) {
  const lessonPath = path.join(lessonsDir, lessonFile);
  let lessonContent = fs.readFileSync(lessonPath, "utf8");

  // Extract sourcePath
  const sourcePathMatch = lessonContent.match(/sourcePath:\s*"([^"]+)"/);
  if (!sourcePathMatch) continue;

  const sourcePath = sourcePathMatch[1];
  const sourceFile = path.join(projectRoot, sourcePath);

  if (!fs.existsSync(sourceFile)) continue;

  const sourceContent = fs.readFileSync(sourceFile, "utf8");
  const sourceLines = sourceContent.split(/\r?\n/);

  // Extract all line objects from lesson
  const lineMatches = Array.from(lessonContent.matchAll(
    /\{\s*number:\s*(\d+),\s*text:\s*"((?:[^"\\]|\\[nt"\\])*)",\s*steps:\s*(\[[^\]]*\])\s*\}/g
  ));

  if (lineMatches.length === 0) continue;

  let needsUpdate = false;
  const newLineObjects = [];

  for (const match of lineMatches) {
    const [fullMatch, oldNumber, text, steps] = match;
    const oldNum = parseInt(oldNumber);

    // Unescape text
    const unescapedText = text.replace(/\\([nt"\\])/g, ($0, $1) => {
      const map = { n: "\n", t: "\t", '"': '"', '\\': '\\' };
      return map[$1] || $0;
    });

    // Check if the text exists at the old line number
    const sourceLineAtOld = sourceLines[oldNum - 1];
    let newNum = oldNum;

    if (sourceLineAtOld !== unescapedText) {
      // Text doesn't match at old line - search for it
      const foundIdx = sourceLines.findIndex(line => line === unescapedText);
      if (foundIdx !== -1) {
        newNum = foundIdx + 1;
        needsUpdate = true;
      }
    }

    // Escape text for output
    const escapedText = unescapedText.replace(/"/g, '\\"');
    newLineObjects.push({
      number: newNum,
      text: escapedText,
      steps,
      updated: newNum !== oldNum
    });

    if (newNum !== oldNum) {
      needsUpdate = true;
    }
  }

  if (!needsUpdate) {
    continue;
  }

  // Build new lines array
  const newLinesStr = newLineObjects
    .map(({ number, text, steps }) => `{ number: ${number}, text: "${text}", steps: ${steps} }`)
    .join(",\n      ");

  const newLinesArray = `lines: [\n      ${newLinesStr}\n    ]`;

  // Replace in content
  const updated = lessonContent.replace(
    /lines:\s*\[\s*[\s\S]*?\n\s*\]/,
    newLinesArray
  );

  fs.writeFileSync(lessonPath, updated, "utf8");
  console.log(`✅ ${lessonFile}: ${newLineObjects.filter(o => o.updated).length} lines updated`);
  fixed++;
}

console.log(`\n📊 Total: ${fixed} files updated`);
