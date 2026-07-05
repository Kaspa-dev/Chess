import { apiClient } from "@/lib/apiClient";

export interface ProfileData {
  id?: string;
  nickname: string;
  avatar: string;
  rating?: number;
  country?: string;
}

export interface ProfileResponse {
  message: string;
  profile?: ProfileData;
}

export interface AvatarResponse {
  avatar?: string;
  avatarUrl?: string;
}

export function getMyProfile() {
  return apiClient.get<ProfileResponse>("/profiles/myprofile");
}

export function getProfileById(id: string) {
  return apiClient.get<ProfileResponse>("/profiles/profile", {
    params: { id },
  });
}

export function getMyAvatar() {
  return apiClient.get<AvatarResponse>("/profiles/myavatar");
}

export function uploadAvatar(formData: FormData) {
  return apiClient.patch("/profiles/uploadavatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
