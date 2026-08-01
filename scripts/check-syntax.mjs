import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "coverage", "dist", "node_modules", "playwright-report", "test-results"]);

const files = await collectJavaScriptFiles(projectRoot);
for (const file of files) {
  await checkSyntax(file);
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return collectJavaScriptFiles(path.join(directory, entry.name));
    }
    if (!entry.isFile() || !/\.(?:js|mjs)$/.test(entry.name)) return [];
    return [path.join(directory, entry.name)];
  }));
  return nested.flat().sort();
}

function checkSyntax(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--check", file], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Syntax check failed: ${path.relative(projectRoot, file)}`));
    });
  });
}
