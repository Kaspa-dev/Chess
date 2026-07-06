import type { MatchHistoryEntry } from "@/services/matchApi";
import type { ProfileData } from "@/services/profileApi";

export interface CountryLookupEntry {
  cca2: string;
}

export type CountryLookupResponse = CountryLookupEntry[];

export interface ProfileHeaderModel {
  nickname: string;
  avatar: string;
  rating: number;
  countryName: string;
}

export type ProfileResultsModel = [wins: number, losses: number, draws: number];

export const DEFAULT_PROFILE_HEADER_MODEL: ProfileHeaderModel = {
  nickname: "",
  avatar: "null",
  rating: 0,
  countryName: "Belgium",
};

export function buildProfileHeaderModel(
  profile?: ProfileData,
): ProfileHeaderModel {
  if (!profile) {
    return DEFAULT_PROFILE_HEADER_MODEL;
  }

  return {
    nickname: profile.nickname,
    avatar: profile.avatar,
    rating: profile.rating ?? 0,
    countryName: profile.country || "Belgium",
  };
}

export function buildProfileResultsModel(
  matches: MatchHistoryEntry[],
): ProfileResultsModel {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    if (match.status === "WIN") {
      wins += 1;
      continue;
    }

    if (match.status === "LOSS") {
      losses += 1;
      continue;
    }

    draws += 1;
  }

  return [wins, losses, draws];
}

export function getFlagUrlFromCountryLookup(
  response: CountryLookupResponse,
): string {
  const code = response[0]?.cca2?.toUpperCase();

  return code ? `https://flagsapi.com/${code}/shiny/48.png` : "";
}
