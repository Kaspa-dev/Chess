type ApiEnv = {
  VITE_API_BASE_URL?: string;
};

export function resolveApiBaseUrl(env: ApiEnv): string {
  const value = env.VITE_API_BASE_URL?.trim();

  if (!value) {
    throw new Error("Missing required environment variable: VITE_API_BASE_URL");
  }

  return value.replace(/\/+$/, "");
}

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env as ApiEnv);

export function buildApiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}
