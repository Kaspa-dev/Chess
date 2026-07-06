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

export interface AiMoveResponse {
  move: string;
  requestedElo: number;
  appliedElo: number | null;
  appliedSkillLevel: number;
}

export function updateRating(payload: { firstPlayer: string; secondPlayer: string; winner: string }) {
  return apiClient.post<RatingUpdateResponse>("/match/update-rating", payload);
}

export function requestAiMove(payload: { fen: string; elo: number }) {
  return apiClient.post<AiMoveResponse>("/match/ai-move", payload);
}

export function getMatchHistory(profileId?: string) {
  return apiClient.get<MatchHistoryEntry[]>("/api/matchhistory", {
    params: profileId ? { profileId } : undefined,
  });
}
