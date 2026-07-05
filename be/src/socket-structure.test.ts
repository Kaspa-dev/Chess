import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("index delegates chess socket orchestration to a dedicated registration module", async () => {
  const indexSource = await readFile(new URL("./index.ts", import.meta.url), "utf8");

  assert.match(
    indexSource,
    /import\s+\{\s*registerChessSocketHandlers\s*\}\s+from\s+"\.\/sockets\/registerChessSocketHandlers\.js"/,
  );
  assert.match(indexSource, /registerChessSocketHandlers\(io\);/);
  assert.doesNotMatch(indexSource, /io\.on\('connection'/);
  assert.doesNotMatch(indexSource, /socket\.on\('joinRoom'/);
  assert.doesNotMatch(indexSource, /socket\.on\('move'/);
});
