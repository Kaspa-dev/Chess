import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const authConfig = {
  jwtSecret: getRequiredEnv("JWT_SECRET"),
};

export function getMailConfig() {
  const user = getRequiredEnv("MAIL_USER");

  return {
    user,
    pass: getRequiredEnv("MAIL_PASS"),
    from: `Inkvizitoriai <${user}>`,
  };
}

export const frontendConfig = {
  baseUrl: trimTrailingSlash(getRequiredEnv("FRONTEND_BASE_URL")),
};
