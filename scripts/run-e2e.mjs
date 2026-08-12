import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listenForPreview } from "./preview-static.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const port = parseAuditPort(process.env.PLAYWRIGHT_PORT ?? "4174");
const server = await listenForPreview({ host, port });
console.log(`DSA Dojo static preview running at http://${host}:${port}`);

let exitCode = 1;
try {
  exitCode = await runPlaywright(port);
} finally {
  server.closeAllConnections?.();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
process.exitCode = exitCode;

function runPlaywright(previewPort) {
  const cliPath = path.join(projectRoot, "node_modules", "@playwright", "test", "cli.js");
  const child = spawn(process.execPath, [cliPath, "test", ...process.argv.slice(2)], {
    cwd: projectRoot,
    env: { ...process.env, PLAYWRIGHT_PORT: String(previewPort) },
    stdio: "inherit",
    windowsHide: true
  });
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Playwright exited after signal ${signal}.`));
      else resolve(code ?? 1);
    });
  });
}

function parseAuditPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError(`PLAYWRIGHT_PORT must be an integer from 1 through 65535; received ${JSON.stringify(value)}.`);
  }
  return port;
}
