import { afterEach, describe, expect, it, vi } from "vitest";

describe("api config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws when VITE_API_BASE_URL is missing", async () => {
    vi.unstubAllEnvs();
    delete (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL;
    vi.resetModules();

    await expect(import("./api")).rejects.toThrow(/VITE_API_BASE_URL/);
  });

  it("trims a trailing slash so callers can append paths safely", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000/");
    vi.resetModules();

    const { apiBaseUrl } = await import("./api");
    expect(apiBaseUrl).toBe("http://localhost:8000");
  });
});
