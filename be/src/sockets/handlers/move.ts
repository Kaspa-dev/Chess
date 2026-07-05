import type { Server, Socket } from "socket.io";
import { saveMatchData, updateRating } from "../../services/game.js";
import { activeGames } from "../gameStore.js";

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
      const winnerEmail = game.userEmails[winner];

      console.log(`Checkmate! ${winner} wins in room ${room}`);
      io.to(room).emit("gameOver", {
        message: `${winner} wins!`,
        winnerEmail,
      });

      void (async () => {
        try {
          const result = await updateRating({
            firstPlayer: game.userEmails.white,
            secondPlayer: game.userEmails.black,
            winner: game.userEmails[winner],
          });
          console.log("Rating update result: " + result?.message);
        } catch (error) {
          console.error("Error:", error);
        }
      })();

      if (game.userEmails.white && game.userEmails.black) {
        void saveMatchData(
          game.userEmails.white,
          game.userEmails.black,
          winnerEmail,
          new Date(),
          room,
        );
      }

      activeGames.delete(room);
      return;
    }

    if (game.chess.isStalemate()) {
      console.log(`Draw in room ${room}`);
      io.to(room).emit("gameOver", { message: "Draw!" });

      if (game.userEmails.white && game.userEmails.black) {
        void saveMatchData(
          game.userEmails.white,
          game.userEmails.black,
          null,
          new Date(),
          room,
        );
      }

      activeGames.delete(room);
    }
  } catch (error) {
    console.error(`Invalid move in room ${room}: ${JSON.stringify(move)}`, error);
    socket.emit("error", { message: "Invalid move" });
  }
};

export { handleMove };
