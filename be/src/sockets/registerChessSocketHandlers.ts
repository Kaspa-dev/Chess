import { Server, Socket } from "socket.io";
import { createPendingGame, hasSocketInActiveGame } from "./gameStore.js";
import { handleDisconnect } from "./handlers/disconnect.js";
import { handleGetOpponentProfile } from "./handlers/getOpponentProfile.js";
import { handleJoinRoom } from "./handlers/joinRoom.js";
import { handleMove } from "./handlers/move.js";
import { handleNewGame } from "./handlers/newGame.js";
import { handleReconnect } from "./handlers/reconnect.js";
import { handleSubmitJWT } from "./handlers/submitJWT.js";

const registerChessSocketHandlers = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    if (hasSocketInActiveGame(socket.id)) {
      console.log(`Socket ${socket.id} is already in an active game`);
      socket.emit("error", { message: "Already in a game" });
      socket.disconnect();
      return;
    }

    const roomId = createPendingGame(socket);
    socket.join(roomId);
    console.log(`Created pending game room: ${roomId} for socket ${socket.id}`);
    socket.emit("roomCreated", {
      room: roomId,
      message: "Share this room ID to invite a player",
    });

    socket.on("joinRoom", (data: { room: string }) => {
      handleJoinRoom(io, socket, data);
    });

    socket.on("submitJWT", (data: { room: string; token: string }) => {
      handleSubmitJWT(socket, data);
    });

    socket.on("getOpponentProfile", async (data: { room: string }) => {
      await handleGetOpponentProfile(socket, data);
    });

    socket.on("move", (data: { room: string; move: { from: string; to: string; promotion?: string } }) => {
      handleMove(io, socket, data);
    });

    socket.on("newGame", (data: { room: string }) => {
      handleNewGame(io, socket, data);
    });

    socket.on("reconnect", (data: { room: string }) => {
      handleReconnect(socket, data);
    });

    socket.on("disconnect", () => {
      void handleDisconnect(io, socket);
    });
  });
};

export { registerChessSocketHandlers };
