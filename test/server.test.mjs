import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import {
  createStudioServer,
  getListenConfig,
  parsePort,
  resolveRequest
} from "../studio/server.mjs";

test("server configuration is local by default and supports deployment overrides", () => {
  assert.deepEqual(getListenConfig({ env: {}, argv: ["node", "server.mjs"] }), {
    host: "127.0.0.1",
    port: 4173
  });
  assert.deepEqual(getListenConfig({
    env: { HOST: "0.0.0.0", PORT: "8080" },
    argv: ["node", "server.mjs", "9000"]
  }), {
    host: "0.0.0.0",
    port: 8080
  });
  assert.equal(parsePort(0), 0);
  for (const value of ["nope", 1.5, -1, 65_536]) {
    assert.throws(() => parsePort(value), /PORT must be an integer/);
  }
});

test("route resolution serves only the required static asset types", () => {
  assert.match(resolveRequest("/studio/src/home.mjs"), /studio[\\/]src[\\/]home\.mjs$/);
  assert.match(resolveRequest("/studio/src/app.mjs"), /studio[\\/]src[\\/]app\.mjs$/);
  assert.match(resolveRequest("/src/app.mjs?cache=bust"), /studio[\\/]src[\\/]app\.mjs$/);
  assert.match(resolveRequest("/favicon.svg"), /studio[\\/]favicon\.svg$/);
  assert.match(resolveRequest("/social-preview.jpg"), /studio[\\/]social-preview\.jpg$/);
  assert.equal(resolveRequest("/src/app.js"), null);
  assert.equal(resolveRequest("/src/README.md"), null);
  assert.equal(resolveRequest("/arrays/find-largest.js"), null);
  assert.equal(resolveRequest("/arrays/%5c..%5cpackage.mjs"), null);
  assert.equal(resolveRequest("/linked-lists/%00model.mjs"), null);
});

test("social preview bytes match the advertised JPEG media type", async () => {
  const content = await readFile(resolveRequest("/social-preview.jpg"));
  assert.deepEqual([...content.subarray(0, 3)], [0xff, 0xd8, 0xff]);
});

test("static server enforces methods, status codes, HEAD behavior, and security headers", async (context) => {
  const server = createStudioServer();
  await listen(server);
  context.after(() => close(server));

  const getResponse = await send(server, { path: "/" });
  assert.equal(getResponse.statusCode, 200);
  assert.match(getResponse.body, /<!doctype html>/i);
  assert.equal(getResponse.headers["content-type"], "text/html; charset=utf-8");
  assert.equal(getResponse.headers["x-content-type-options"], "nosniff");
  assert.equal(getResponse.headers["x-frame-options"], "DENY");
  assert.match(getResponse.headers["content-security-policy"], /default-src 'self'/);
  assert.equal(getResponse.headers["cross-origin-opener-policy"], "same-origin");
  assert.equal(getResponse.headers["referrer-policy"], "no-referrer");

  const headResponse = await send(server, { method: "HEAD", path: "/studio/src/app.mjs" });
  assert.equal(headResponse.statusCode, 200);
  assert.equal(headResponse.body, "");
  assert.ok(Number(headResponse.headers["content-length"]) > 0);

  const previewResponse = await send(server, { method: "HEAD", path: "/social-preview.jpg" });
  assert.equal(previewResponse.statusCode, 200);
  assert.equal(previewResponse.headers["content-type"], "image/jpeg");

  const missingResponse = await send(server, { path: "/not-a-route" });
  assert.equal(missingResponse.statusCode, 404);
  assert.equal(missingResponse.body, "Not found\n");
  assert.equal(missingResponse.headers["cache-control"], "no-store");

  const forbiddenPathResponse = await send(server, { path: "/package.json" });
  assert.equal(forbiddenPathResponse.statusCode, 404);

  const postResponse = await send(server, { method: "POST", path: "/" });
  assert.equal(postResponse.statusCode, 405);
  assert.equal(postResponse.headers.allow, "GET, HEAD");
  assert.equal(postResponse.body, "Method not allowed\n");
});

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function send(server, { method = "GET", path }) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const outgoing = request({
      host: "127.0.0.1",
      method,
      path,
      port: address.port
    }, (response) => {
      response.setEncoding("utf8");
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => resolve({
        body,
        headers: response.headers,
        statusCode: response.statusCode
      }));
    });
    outgoing.on("error", reject);
    outgoing.end();
  });
}
