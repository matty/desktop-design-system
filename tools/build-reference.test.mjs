import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

describe("reference build determinism", () => {
  it("reference:check passes against freshly committed outputs", () => {
    // Rebuild twice — outputs must be byte-identical.
    execFileSync("node", ["tools/build-reference.mjs"], { cwd: process.cwd() });
    const before = readFileSync("reference/manifest.json", "utf8");
    execFileSync("node", ["tools/build-reference.mjs"], { cwd: process.cwd() });
    const after = readFileSync("reference/manifest.json", "utf8");
    expect(after).toBe(before);
    // --check must pass without drift (exits 0; throws on non-zero exit).
    execFileSync("node", ["tools/build-reference.mjs", "--check"], { cwd: process.cwd() });
  }, 120000);
});
