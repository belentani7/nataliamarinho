import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "index.html");

assert.ok(existsSync(entry), "index.html must be the deploy entrypoint");
assert.ok(!existsSync(resolve(root, "index.html.html")), "double HTML extension must be removed");

const html = readFileSync(entry, "utf8");
const localReferences = [...html.matchAll(/\b(?:src|href)=["']([^"'#]+)["']/gi)]
  .map((match) => match[1])
  .filter((value) => !/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(value));

for (const reference of localReferences) {
  assert.ok(existsSync(resolve(root, decodeURIComponent(reference))), `missing local asset: ${reference}`);
}

for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
  assert.match(match[0], /\brel=["'][^"']*noopener[^"']*["']/i, "external tabs require rel=noopener");
}

assert.match(html, /aria-controls=["']primary-navigation["']/i, "mobile navigation needs a labelled toggle");
assert.match(html, /prefers-reduced-motion:\s*reduce/i, "motion must respect the OS preference");
assert.match(html, /Contenido disponible en español/i, "language availability must be explicit");

console.log(`Natalia smoke OK: ${localReferences.length} local references resolved`);
