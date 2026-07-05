import { Chess } from "chess.js";
import type { Server, Socket } from "socket.io";
import { activeGames, pendingGames } from "../gameStore.js";
import type { Game } from "../types.js";

const handleJoinRoom = (
  io: Server,
  socket: Socket,
  data: { room: string },
): void => {
  const { room } = data;
  const pendingGame = pendingGames.get(room);

  if (!pendingGame) {
    socket.emit("error", { message: "Room not found or game already started" });
    return;
  }

  if (pendingGame.creator.id === socket.id) {
    socket.emit("error", { message: "Cannot join your own game" });
    return;
  }

  if (!pendingGame.creator.connected) {
    pendingGames.delete(room);
    socket.emit("error", { message: "Room creator disconnected" });
    return;
  }

  const game: Game = {
    chess: new Chess(),
    players: { white: pendingGame.creator.id, black: socket.id },
    userEmails: { white: null, black: null },
    userIDs: { white: null, black: null },
  };

  activeGames.set(room, game);
  pendingGames.delete(room);

  socket.join(room);
  console.log(`Game started: room=${room}, white=${game.players.white}, black=${socket.id}`);
  io.to(room).emit("gameStart", {
    room,
    white: game.players.white,
    black: socket.id,
    fen: game.chess.fen(),
  });
};

export { handleJoinRoom };
