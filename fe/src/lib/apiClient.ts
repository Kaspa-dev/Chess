import axios from "axios";

import { apiBaseUrl } from "@/config/api";

type RequestConfigWithHeaders = {
  headers?: Record<string, string>;
};

export function attachAuthHeader(config: RequestConfigWithHeaders): RequestConfigWithHeaders {
  const token = localStorage.getItem("JWT");

  if (!token) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;

  return config;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

apiClient.interceptors.request.use((config) => attachAuthHeader(config as RequestConfigWithHeaders) as never);
