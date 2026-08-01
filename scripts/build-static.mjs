import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const studioRoot = path.join(projectRoot, "studio");
const outputRoot = path.join(projectRoot, "dist");

const algorithmFiles = {
  arrays: [
    "find-largest.mjs",
    "move-zeros.mjs",
    "reverse-array.mjs",
    "sliding-window.mjs"
  ],
  "linked-lists": [
    "detect-cycle.mjs",
    "model.mjs",
    "reverse-linked-list.mjs",
    "traverse-linked-list.mjs"
  ]
};

await rm(outputRoot, { recursive: true, force: true });
await mkdir(path.join(outputRoot, "studio"), { recursive: true });

await Promise.all([
  copyFile(path.join(studioRoot, "home.html"), path.join(outputRoot, "index.html")),
  copyFile(path.join(studioRoot, "index.html"), path.join(outputRoot, "studio", "index.html")),
  copyFile(path.join(studioRoot, "home.css"), path.join(outputRoot, "home.css")),
  copyFile(path.join(studioRoot, "styles.css"), path.join(outputRoot, "styles.css")),
  copyFile(path.join(studioRoot, "pip.css"), path.join(outputRoot, "pip.css")),
  copyFile(path.join(studioRoot, "favicon.svg"), path.join(outputRoot, "favicon.svg")),
  copyFile(path.join(studioRoot, "social-preview.jpg"), path.join(outputRoot, "social-preview.jpg")),
  cp(path.join(studioRoot, "src"), path.join(outputRoot, "src"), { recursive: true })
]);

for (const [directory, files] of Object.entries(algorithmFiles)) {
  const destination = path.join(outputRoot, directory);
  await mkdir(destination, { recursive: true });
  await Promise.all(files.map((file) => (
    copyFile(path.join(projectRoot, directory, file), path.join(destination, file))
  )));
}

console.log(`Built static site at ${outputRoot}`);
