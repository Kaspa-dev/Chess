import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function getBackendRootDir(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);

  return path.resolve(currentDir, "..");
}

function getDefaultStockfishPath(): string {
  return path.resolve(
    getBackendRootDir(),
    "engines",
    "stockfish-windows-x86-64-avx2.exe",
  );
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

export const stockfishConfig = {
  enginePath:
    process.env.STOCKFISH_PATH?.trim() || getDefaultStockfishPath(),
  moveTimeMs: 200,
  timeoutMs: 5_000,
};
