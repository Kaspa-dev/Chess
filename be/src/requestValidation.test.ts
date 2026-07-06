import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAuthCredentials,
  parsePasswordChangePayload,
  parseProfileEditPayload,
} from "./validation/requestPayloads.js";

test("parseAuthCredentials trims and normalizes emails", () => {
  assert.deepEqual(
    parseAuthCredentials({
      email: "  Kaspa@Example.com  ",
      password: "secret-password",
    }),
    {
      email: "kaspa@example.com",
      password: "secret-password",
    },
  );
});

test("parseAuthCredentials rejects invalid email formats", () => {
  assert.throws(
    () =>
      parseAuthCredentials({
        email: "not-an-email",
        password: "secret-password",
      }),
    {
      message: "Email must be a valid email address",
    },
  );
});

test("parseAuthCredentials rejects emails that are blank after trimming", () => {
  assert.throws(
    () =>
      parseAuthCredentials({
        email: "   ",
        password: "secret-password",
      }),
    {
      message: "Email is required",
    },
  );
});

test("parsePasswordChangePayload enforces the password length rule", () => {
  assert.throws(
    () =>
      parsePasswordChangePayload({
        oldPassword: "current-password",
        newPassword: "short",
      }),
    {
      message: "New password must be between 8 and 64 characters long",
    },
  );
});

test("parseProfileEditPayload trims nickname and uppercases ISO country codes", () => {
  assert.deepEqual(
    parseProfileEditPayload({
      newUserName: "  Kaspa_123  ",
      newCountry: " lt ",
    }),
    {
      newUserName: "Kaspa_123",
      newCountry: "LT",
    },
  );
});

test("parseProfileEditPayload rejects nicknames with spaces", () => {
  assert.throws(
    () =>
      parseProfileEditPayload({
        newUserName: "Kaspa Dev",
        newCountry: "LT",
      }),
    {
      message:
        "Nickname must be 3 to 64 characters and contain only letters, numbers, or underscores",
    },
  );
});

test("parseProfileEditPayload rejects non ISO alpha-2 country codes", () => {
  assert.throws(
    () =>
      parseProfileEditPayload({
        newUserName: "Kaspa_123",
        newCountry: "Lithuania",
      }),
    {
      message: "Country must be a valid ISO 3166-1 alpha-2 code",
    },
  );
});
