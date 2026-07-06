import type { Server, Socket } from "socket.io";
import { activeGames, pendingGames } from "../gameStore.js";
import { finishGame } from "../finishGame.js";

const handleDisconnect = async (
  io: Server,
  socket: Socket,
  finishGameFn: typeof finishGame = finishGame,
): Promise<void> => {
  console.log(`Disconnected from chess: ${socket.id}`);

  for (const [room, pendingGame] of pendingGames) {
    if (pendingGame.creator.id === socket.id) {
      pendingGames.delete(room);
      console.log(`Removed pending game room ${room} due to creator disconnection`);
    }
  }

  for (const [room, game] of activeGames) {
    if (game.players.white === socket.id || game.players.black === socket.id) {
      const winnerColor = game.players.white === socket.id ? "black" : "white";
      await finishGameFn({
        room,
        game,
        io,
        message: `${winnerColor} wins!`,
        winnerColor,
      });
      console.log(`Ended game in room ${room} due to disconnection`);
      break;
    }
  }
};

export { handleDisconnect };
