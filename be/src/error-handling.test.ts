import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("AppError keeps HTTP metadata for API responses", async () => {
  const { AppError } = await import("./errors/AppError.js");

  const error = new AppError(404, "Account does not exist", "ACCOUNT_NOT_FOUND");

  assert.equal(error.statusCode, 404);
  assert.equal(error.message, "Account does not exist");
  assert.equal(error.code, "ACCOUNT_NOT_FOUND");
});

test("errorHandler returns structured JSON for AppError instances", async () => {
  const { AppError } = await import("./errors/AppError.js");
  const { errorHandler } = await import("./middleware/errorHandler.js");

  let capturedStatusCode: number | undefined;
  let capturedBody: unknown;

  const response = {
    headersSent: false,
    status(code: number) {
      capturedStatusCode = code;
      return {
        json(body: unknown) {
          capturedBody = body;
        },
      };
    },
  };

  errorHandler(
    new AppError(401, "Incorrect password", "INVALID_CREDENTIALS"),
    {} as never,
    response as never,
    (() => undefined) as never,
  );

  assert.equal(capturedStatusCode, 401);
  assert.deepEqual(capturedBody, {
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Incorrect password",
      details: null,
    },
  });
});

test("errorHandler falls back to a predictable 500 payload for unknown errors", async () => {
  const { errorHandler } = await import("./middleware/errorHandler.js");

  let capturedStatusCode: number | undefined;
  let capturedBody: unknown;

  const response = {
    headersSent: false,
    status(code: number) {
      capturedStatusCode = code;
      return {
        json(body: unknown) {
          capturedBody = body;
        },
      };
    },
  };

  errorHandler(
    new Error("boom"),
    {} as never,
    response as never,
    (() => undefined) as never,
  );

  assert.equal(capturedStatusCode, 500);
  assert.deepEqual(capturedBody, {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      details: null,
    },
  });
});

test("index mounts the shared error handler after route registration", async () => {
  const indexSource = await readFile(new URL("./index.ts", import.meta.url), "utf8");

  assert.match(indexSource, /import\s+\{\s*errorHandler\s*\}\s+from\s+"\.\/middleware\/errorHandler\.js"/);
  assert.match(
    indexSource,
    /app\.use\("\/authentication", authenticationRouter\);[\s\S]*app\.use\("\/profiles", profilesRouter\);[\s\S]*app\.use\("\/match", matchRouter\);[\s\S]*app\.use\("\/api", matchHistoryRoute\);[\s\S]*app\.use\(errorHandler\);/,
  );
});
