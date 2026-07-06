import type { Server, Socket } from "socket.io";
import { activeGames } from "../gameStore.js";
import { finishGame } from "../finishGame.js";

const handleMove = (
  io: Server,
  socket: Socket,
  data: { room: string; move: { from: string; to: string; promotion?: string } },
): void => {
  const { room, move } = data;
  const game = activeGames.get(room);

  if (!game) {
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  const isWhiteTurn = game.chess.turn() === "w";
  const playerId = socket.id;
  const isPlayerTurn =
    (isWhiteTurn && game.players.white === playerId) ||
    (!isWhiteTurn && game.players.black === playerId);

  if (!isPlayerTurn) {
    socket.emit("error", { message: "Not your turn" });
    return;
  }

  try {
    const result = game.chess.move(move);

    if (!result) {
      socket.emit("error", { message: "Invalid move" });
      return;
    }

    console.log(`Move made in room ${room}: ${JSON.stringify(move)}`);
    io.to(room).emit("move", { move, fen: game.chess.fen() });

    if (game.chess.isCheckmate()) {
      const winner = game.chess.turn() === "w" ? "black" : "white";

      console.log(`Checkmate! ${winner} wins in room ${room}`);
      void finishGame({
        room,
        game,
        io,
        message: `${winner} wins!`,
        winnerColor: winner,
      });
      return;
    }

    if (game.chess.isStalemate()) {
      console.log(`Draw in room ${room}`);
      void finishGame({
        room,
        game,
        io,
        message: "Draw!",
      });
    }
  } catch (error) {
    console.error(`Invalid move in room ${room}: ${JSON.stringify(move)}`, error);
    socket.emit("error", { message: "Invalid move" });
  }
};

export { handleMove };
