import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const lessonsDir = path.join(projectRoot, "studio/src/lessons");
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mjs"));

let fixed = 0;
let errors = 0;

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

  // Extract current lines array from lesson
  const linesArrayMatch = lessonContent.match(/lines:\s*\[\s*([\s\S]*?)\s*\]/);
  if (!linesArrayMatch) continue;

  const oldLinesText = linesArrayMatch[1];
  
  // Parse each line object
  const lineObjectMatches = oldLinesText.matchAll(
    /\{\s*number:\s*(\d+),\s*text:\s*"([^"]*)(?:\\\\[nt"]|[^"\\])*",\s*steps:\s*(\[[^\]]*\])\s*\}/g
  );

  const oldLines = Array.from(lineObjectMatches).map(m => ({
    number: parseInt(m[1]),
    text: m[2],
    steps: m[3]
  }));

  if (oldLines.length === 0) continue;

  // For each line, find where it actually appears in source
  const newLines = [];
  let foundError = false;

  for (const line of oldLines) {
    const { text, steps } = line;
    
    // Try to find the exact text in source file
    const actualLineNum = sourceLines.findIndex(sourceLine => sourceLine === text) + 1;
    
    if (actualLineNum === 0) {
      // Text not found as exact match - this might be an error
      // Try to find it approximately or keep old number
      newLines.push({ number: line.number, text, steps });
      foundError = true;
    } else {
      newLines.push({ number: actualLineNum, text, steps });
    }
  }

  if (foundError) {
    console.log(`⚠️  ${lessonFile}: some lines not found in source (keeping old numbers)`);
    errors++;
    continue;
  }

  // Build the new lines array
  const newLineObjects = newLines
    .map(({ number, text, steps }) => {
      const escapedText = text.replace(/"/g, '\\"');
      return `{ number: ${number}, text: "${escapedText}", steps: ${steps} }`;
    })
    .join(",\n      ");

  const newLinesArray = `lines: [\n      ${newLineObjects}\n    ]`;

  // Replace in content
  const updatedContent = lessonContent.replace(/lines:\s*\[\s*[\s\S]*?\s*\]/,  newLinesArray);

  fs.writeFileSync(lessonPath, updatedContent, "utf8");
  console.log(`✅ ${lessonFile}`);
  fixed++;
}

console.log(`\n📊 Fixed: ${fixed}, Errors: ${errors}`);
