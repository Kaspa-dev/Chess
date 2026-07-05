import { apiClient } from "@/lib/apiClient";

export interface MatchHistoryEntry {
  status: string;
  opponentName: string;
  date: string;
}

export interface RatingUpdateResponse {
  message: string;
  newRating: number;
}

export function updateRating(payload: { firstPlayer: string; secondPlayer: string; winner: string }) {
  return apiClient.post<RatingUpdateResponse>("/match/update-rating", payload);
}

export function getMatchHistory(profileId?: string) {
  return apiClient.get<MatchHistoryEntry[]>("/api/matchhistory", {
    params: profileId ? { profileId } : undefined,
  });
}
