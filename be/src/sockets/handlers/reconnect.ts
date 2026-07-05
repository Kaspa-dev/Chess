import type { Socket } from "socket.io";
import { activeGames } from "../gameStore.js";

const handleReconnect = (
  socket: Socket,
  data: { room: string },
): void => {
  const { room } = data;
  const game = activeGames.get(room);

  if (!game) {
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  if (game.players.white !== socket.id && game.players.black !== socket.id) {
    socket.emit("error", { message: "Not a player in this game" });
    return;
  }

  socket.join(room);
  socket.emit("gameStart", {
    room,
    white: game.players.white,
    black: game.players.black,
    fen: game.chess.fen(),
  });
  console.log(`Player ${socket.id} reconnected to room ${room}`);
};

export { handleReconnect };
