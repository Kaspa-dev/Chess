import { useEffect, useState } from "react";

import { getMyProfile } from "@/services/profileApi";

export interface ProfileSummary {
  nickname: string;
  avatar: string;
  rating: number;
  country: string;
}

const defaultProfile: ProfileSummary = {
  nickname: "",
  avatar: "null",
  rating: 0,
  country: "",
};

export function useProfileSummary() {
  const [profile, setProfile] = useState<ProfileSummary>(defaultProfile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();

        if (response?.data?.profile) {
          setProfile({
            nickname: response.data.profile.nickname,
            avatar: response.data.profile.avatar,
            rating: response.data.profile.rating || 0,
            country: response.data.profile.country || "",
          });
        } else {
          console.log("Error fetching profile:", response?.data?.message);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    void fetchProfile();
  }, []);

  return profile;
}
