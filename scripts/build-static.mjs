import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { curriculumModulePaths } from "../studio/src/curriculum-manifest.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const studioRoot = path.join(projectRoot, "studio");
const outputRoot = path.join(projectRoot, "dist");

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
  cp(path.join(studioRoot, "src"), path.join(outputRoot, "studio", "src"), { recursive: true })
]);

await Promise.all(curriculumModulePaths.map(async (modulePath) => {
  const segments = modulePath.split("/");
  const source = path.join(projectRoot, ...segments);
  const destination = path.join(outputRoot, ...segments);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}));

console.log(`Built static site at ${outputRoot}`);
