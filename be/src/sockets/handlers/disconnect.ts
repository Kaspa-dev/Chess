import type { Server, Socket } from "socket.io";
import { activeGames, pendingGames } from "../gameStore.js";

const handleDisconnect = (io: Server, socket: Socket): void => {
  console.log(`Disconnected from chess: ${socket.id}`);

  for (const [room, pendingGame] of pendingGames) {
    if (pendingGame.creator.id === socket.id) {
      pendingGames.delete(room);
      console.log(`Removed pending game room ${room} due to creator disconnection`);
    }
  }

  for (const [room, game] of activeGames) {
    if (game.players.white === socket.id || game.players.black === socket.id) {
      io.to(room).emit("opponentDisconnected", { message: "Opponent disconnected" });
      activeGames.delete(room);
      console.log(`Ended game in room ${room} due to disconnection`);
      break;
    }
  }
};

export { handleDisconnect };
