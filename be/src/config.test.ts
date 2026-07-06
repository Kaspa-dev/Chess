import test from "node:test";
import assert from "node:assert/strict";

test("env config throws when required server-wide variables are missing", async () => {
  const previous = {
    DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
  };

  process.env.DOTENV_CONFIG_PATH = ".env.test-does-not-exist";
  delete process.env.JWT_SECRET;
  delete process.env.MAIL_USER;
  delete process.env.MAIL_PASS;
  delete process.env.FRONTEND_BASE_URL;

  try {
    await import(`./config.js?missing=${Date.now()}`);
    assert.fail("Expected config import to throw when required env vars are missing");
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.match(error.message, /Missing required environment variable/);
  } finally {
    restoreEnv("DOTENV_CONFIG_PATH", previous.DOTENV_CONFIG_PATH);
    restoreEnv("JWT_SECRET", previous.JWT_SECRET);
    restoreEnv("MAIL_USER", previous.MAIL_USER);
    restoreEnv("MAIL_PASS", previous.MAIL_PASS);
    restoreEnv("FRONTEND_BASE_URL", previous.FRONTEND_BASE_URL);
  }
});

test("env config allows startup without mail variables until email confirmation is used", async () => {
  const previous = {
    DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
  };

  process.env.DOTENV_CONFIG_PATH = ".env.test-does-not-exist";
  process.env.JWT_SECRET = "test-secret";
  delete process.env.MAIL_USER;
  delete process.env.MAIL_PASS;
  process.env.FRONTEND_BASE_URL = "http://localhost:5173/";

  try {
    const { authConfig, frontendConfig, getMailConfig } = await import(`./config.js?mail-optional=${Date.now()}`);

    assert.equal(authConfig.jwtSecret, "test-secret");
    assert.equal(frontendConfig.baseUrl, "http://localhost:5173");
    assert.throws(() => getMailConfig(), /Missing required environment variable: MAIL_USER/);
  } finally {
    restoreEnv("DOTENV_CONFIG_PATH", previous.DOTENV_CONFIG_PATH);
    restoreEnv("JWT_SECRET", previous.JWT_SECRET);
    restoreEnv("MAIL_USER", previous.MAIL_USER);
    restoreEnv("MAIL_PASS", previous.MAIL_PASS);
    restoreEnv("FRONTEND_BASE_URL", previous.FRONTEND_BASE_URL);
  }
});

test("env config trims frontend base URL once so callers can append paths safely", async () => {
  const previous = {
    DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
  };

  process.env.DOTENV_CONFIG_PATH = ".env.test-does-not-exist";
  process.env.JWT_SECRET = "test-secret";
  process.env.MAIL_USER = "mailer@example.com";
  process.env.MAIL_PASS = "app-password";
  process.env.FRONTEND_BASE_URL = "http://localhost:5173/";

  try {
    const { frontendConfig } = await import(`./config.js?trimmed=${Date.now()}`);
    assert.equal(frontendConfig.baseUrl, "http://localhost:5173");
  } finally {
    restoreEnv("DOTENV_CONFIG_PATH", previous.DOTENV_CONFIG_PATH);
    restoreEnv("JWT_SECRET", previous.JWT_SECRET);
    restoreEnv("MAIL_USER", previous.MAIL_USER);
    restoreEnv("MAIL_PASS", previous.MAIL_PASS);
    restoreEnv("FRONTEND_BASE_URL", previous.FRONTEND_BASE_URL);
  }
});

test("env config falls back to the bundled stockfish path when no override is set", async () => {
  const previous = {
    DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
    STOCKFISH_PATH: process.env.STOCKFISH_PATH,
  };

  process.env.DOTENV_CONFIG_PATH = ".env.test-does-not-exist";
  process.env.JWT_SECRET = "test-secret";
  process.env.MAIL_USER = "mailer@example.com";
  process.env.MAIL_PASS = "app-password";
  process.env.FRONTEND_BASE_URL = "http://localhost:5173/";
  delete process.env.STOCKFISH_PATH;

  try {
    const { stockfishConfig } = await import(`./config.js?stockfish-default=${Date.now()}`);
    assert.match(stockfishConfig.enginePath, /[\\/]engines[\\/]stockfish-windows-x86-64-avx2\.exe$/);
  } finally {
    restoreEnv("DOTENV_CONFIG_PATH", previous.DOTENV_CONFIG_PATH);
    restoreEnv("JWT_SECRET", previous.JWT_SECRET);
    restoreEnv("MAIL_USER", previous.MAIL_USER);
    restoreEnv("MAIL_PASS", previous.MAIL_PASS);
    restoreEnv("FRONTEND_BASE_URL", previous.FRONTEND_BASE_URL);
    restoreEnv("STOCKFISH_PATH", previous.STOCKFISH_PATH);
  }
});

test("env config uses a stockfish path override when provided", async () => {
  const previous = {
    DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
    STOCKFISH_PATH: process.env.STOCKFISH_PATH,
  };

  process.env.DOTENV_CONFIG_PATH = ".env.test-does-not-exist";
  process.env.JWT_SECRET = "test-secret";
  process.env.MAIL_USER = "mailer@example.com";
  process.env.MAIL_PASS = "app-password";
  process.env.FRONTEND_BASE_URL = "http://localhost:5173/";
  process.env.STOCKFISH_PATH = "C:/custom/stockfish.exe";

  try {
    const { stockfishConfig } = await import(`./config.js?stockfish-override=${Date.now()}`);
    assert.equal(stockfishConfig.enginePath, "C:/custom/stockfish.exe");
  } finally {
    restoreEnv("DOTENV_CONFIG_PATH", previous.DOTENV_CONFIG_PATH);
    restoreEnv("JWT_SECRET", previous.JWT_SECRET);
    restoreEnv("MAIL_USER", previous.MAIL_USER);
    restoreEnv("MAIL_PASS", previous.MAIL_PASS);
    restoreEnv("FRONTEND_BASE_URL", previous.FRONTEND_BASE_URL);
    restoreEnv("STOCKFISH_PATH", previous.STOCKFISH_PATH);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
