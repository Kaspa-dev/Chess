import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("authentication uses a single bcrypt implementation", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
  };

  const dependencies = packageJson.dependencies ?? {};

  assert.ok(dependencies.bcryptjs, "Expected bcryptjs to remain installed");
  assert.equal(
    dependencies.bcrypt,
    undefined,
    "Expected bcrypt to be removed so hashing uses one library only",
  );

  const authenticationController = await readFile(
    new URL("./controllers/authentication.ts", import.meta.url),
    "utf8",
  );

  assert.match(authenticationController, /import bcrypt from "bcryptjs";/);
});
