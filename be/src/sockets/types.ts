import type { Chess } from "chess.js";
import type { Socket } from "socket.io";

export interface Game {
  chess: Chess;
  players: { white: string; black: string };
  userEmails: { white: string | null; black: string | null };
  userIDs: { white: number | null; black: number | null };
}

export interface PendingGame {
  creator: Socket;
}
