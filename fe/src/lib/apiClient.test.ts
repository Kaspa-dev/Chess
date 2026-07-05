import { beforeEach, describe, expect, it, vi } from "vitest";

type RequestConfigWithHeaders = {
  headers?: Record<string, string>;
};

const interceptorUse = vi.fn();
const createMock = vi.fn(() => ({
  interceptors: {
    request: {
      use: interceptorUse,
    },
  },
}));

vi.mock("axios", () => ({
  default: {
    create: createMock,
  },
}));

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a bearer token to outgoing requests when JWT is present", async () => {
    localStorage.setItem("JWT", "secret-token");

    const { attachAuthHeader } = await import("./apiClient");

    const config = attachAuthHeader({
      headers: {},
    } as RequestConfigWithHeaders);

    expect(config.headers?.Authorization).toBe("Bearer secret-token");
  });

  it("leaves outgoing requests unchanged when JWT is missing", async () => {
    const { attachAuthHeader } = await import("./apiClient");

    const config = attachAuthHeader({
      headers: {},
    } as RequestConfigWithHeaders);

    expect(config.headers?.Authorization).toBeUndefined();
  });
});
