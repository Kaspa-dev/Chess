import { apiClient } from "@/lib/apiClient";

export interface AuthResponse {
  message: string;
  token?: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export function login(payload: { email: string; password: string }) {
  return apiClient.post<AuthResponse>("/authentication/login", payload);
}

export function register(payload: { email: string | null; password: string | null }) {
  return apiClient.post<AuthResponse>("/authentication/register", payload);
}

export function sendConfirmation(payload: { email: string; password: string }) {
  return apiClient.post<AuthResponse>("/authentication/sendConfirmation", payload);
}

export function changePassword(payload: { oldPassword: string; newPassword: string }) {
  return apiClient.patch<ChangePasswordResponse>("/authentication/changepassword", payload);
}

export function editProfile(payload: Record<string, unknown>) {
  return apiClient.patch("/authentication/editprofile", payload);
}
