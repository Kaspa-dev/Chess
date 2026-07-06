import { AppError } from "../errors/AppError.js";

type UnknownRecord = Record<string, unknown>;

type AuthCredentials = {
  email: string;
  password: string;
};

type PasswordChangePayload = {
  oldPassword: string;
  newPassword: string;
};

type ProfileEditPayload = {
  newUserName: string;
  newCountry: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_COUNTRY_PATTERN = /^[A-Z]{2}$/;
const NICKNAME_PATTERN = /^[A-Za-z0-9_]{3,64}$/;

function expectRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(400, "Request body must be an object", "VALIDATION_ERROR");
  }

  return value as UnknownRecord;
}

function expectString(value: unknown, fieldLabel: string): string {
  if (typeof value !== "string") {
    throw new AppError(400, `${fieldLabel} is required`, "VALIDATION_ERROR");
  }

  return value;
}

function parseRequiredTrimmedString(value: unknown, fieldLabel: string): string {
  const trimmed = expectString(value, fieldLabel).trim();

  if (!trimmed) {
    throw new AppError(400, `${fieldLabel} is required`, "VALIDATION_ERROR");
  }

  return trimmed;
}

function parsePassword(value: unknown, fieldLabel: string): string {
  const password = expectString(value, fieldLabel);

  if (!password) {
    throw new AppError(400, `${fieldLabel} is required`, "VALIDATION_ERROR");
  }

  return password;
}

function validatePasswordLength(password: string, fieldLabel: string): void {
  if (password.length < 8 || password.length > 64) {
    throw new AppError(
      400,
      `${fieldLabel} must be between 8 and 64 characters long`,
      "VALIDATION_ERROR",
    );
  }
}

function parseEmail(value: unknown): string {
  const email = parseRequiredTrimmedString(value, "Email").toLowerCase();

  if (email.length < 3 || email.length > 254) {
    throw new AppError(
      400,
      "Email must be between 3 and 254 characters long",
      "VALIDATION_ERROR",
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "Email must be a valid email address", "VALIDATION_ERROR");
  }

  return email;
}

function parseNickname(value: unknown): string {
  const nickname = parseRequiredTrimmedString(value, "Nickname");

  if (!NICKNAME_PATTERN.test(nickname)) {
    throw new AppError(
      400,
      "Nickname must be 3 to 64 characters and contain only letters, numbers, or underscores",
      "VALIDATION_ERROR",
    );
  }

  return nickname;
}

function parseCountry(value: unknown): string {
  const country = parseRequiredTrimmedString(value, "Country").toUpperCase();

  if (!ISO_COUNTRY_PATTERN.test(country)) {
    throw new AppError(
      400,
      "Country must be a valid ISO 3166-1 alpha-2 code",
      "VALIDATION_ERROR",
    );
  }

  return country;
}

export function parseAuthCredentials(payload: unknown): AuthCredentials {
  const body = expectRecord(payload);
  const email = parseEmail(body.email);
  const password = parsePassword(body.password, "Password");

  validatePasswordLength(password, "Password");

  return { email, password };
}

export function parsePasswordChangePayload(payload: unknown): PasswordChangePayload {
  const body = expectRecord(payload);
  const oldPassword = parsePassword(body.oldPassword, "Old password");
  const newPassword = parsePassword(body.newPassword, "New password");

  validatePasswordLength(newPassword, "New password");

  return { oldPassword, newPassword };
}

export function parseProfileEditPayload(payload: unknown): ProfileEditPayload {
  const body = expectRecord(payload);

  return {
    newUserName: parseNickname(body.newUserName),
    newCountry: parseCountry(body.newCountry),
  };
}
