import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("register only invokes profile creation once", async () => {
  const authenticationController = await readFile(
    new URL("./controllers/authentication.ts", import.meta.url),
    "utf8",
  );

  const registerBody = authenticationController.match(
    /export const register[\s\S]*?export const login/,
  );

  assert.ok(registerBody, "Expected to find the register handler");

  const profileCreationCalls =
    registerBody[0].match(/createProfileOnRegister\(user\)/g)?.length ?? 0;

  assert.equal(profileCreationCalls, 1);
});
