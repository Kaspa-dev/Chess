import type { Server } from "socket.io";

import { saveMatchData, updateRating } from "../services/game.js";
import { activeGames } from "./gameStore.js";
import type { Game } from "./types.js";

interface FinishGameOptions {
  room: string;
  game: Game;
  io: Server;
  message: string;
  winnerColor?: "white" | "black";
  saveMatchDataFn?: typeof saveMatchData;
  updateRatingFn?: typeof updateRating;
}

const finishGame = async ({
  room,
  game,
  io,
  message,
  winnerColor,
  saveMatchDataFn = saveMatchData,
  updateRatingFn = updateRating,
}: FinishGameOptions): Promise<void> => {
  const winnerEmail = winnerColor ? game.userEmails[winnerColor] : null;

  io.to(room).emit("gameOver", {
    message,
    ...(winnerEmail ? { winnerEmail } : {}),
  });

  if (game.userEmails.white && game.userEmails.black) {
    if (winnerEmail) {
      try {
        const result = await updateRatingFn({
          firstPlayer: game.userEmails.white,
          secondPlayer: game.userEmails.black,
          winner: winnerEmail,
        });
        console.log("Rating update result: " + result?.message);
      } catch (error) {
        console.error("Error updating rating:", error);
      }
    }

    try {
      await saveMatchDataFn(
        game.userEmails.white,
        game.userEmails.black,
        winnerEmail,
        new Date(),
        room,
      );
    } catch (error) {
      console.error("Error saving match data:", error);
    }
  }

  activeGames.delete(room);
};

export { finishGame };
