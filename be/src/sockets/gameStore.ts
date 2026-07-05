import { v4 as uuidv4 } from "uuid";
import type { Socket } from "socket.io";
import type { Game, PendingGame } from "./types.js";

const pendingGames: Map<string, PendingGame> = new Map();
const activeGames: Map<string, Game> = new Map();

const createPendingGame = (socket: Socket): string => {
  const roomId = uuidv4();
  pendingGames.set(roomId, { creator: socket });
  return roomId;
};

const hasSocketInActiveGame = (socketId: string): boolean => {
  for (const game of activeGames.values()) {
    if (game.players.white === socketId || game.players.black === socketId) {
      return true;
    }
  }

  return false;
};

export {
  activeGames,
  createPendingGame,
  hasSocketInActiveGame,
  pendingGames,
};
