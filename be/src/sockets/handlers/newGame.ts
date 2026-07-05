import { Chess } from "chess.js";
import type { Server, Socket } from "socket.io";
import { activeGames } from "../gameStore.js";

const handleNewGame = (
  io: Server,
  socket: Socket,
  data: { room: string },
): void => {
  const { room } = data;
  const game = activeGames.get(room);

  if (!game) {
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  game.chess = new Chess();
  console.log(`New game started in room ${room}`);
  io.to(room).emit("gameReset", {
    fen: game.chess.fen(),
    message: "New game started",
  });
};

export { handleNewGame };
