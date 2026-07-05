import type { Response } from "express";
import type { Socket } from "socket.io";
import validateJWT, { type AuthRequest } from "../../middleware/requestAuthorization.js";
import { activeGames } from "../gameStore.js";

const handleSubmitJWT = (
  socket: Socket,
  data: { room: string; token: string },
): void => {
  const { room, token } = data;
  console.log(`JWT token received for socket ${socket.id} in room ${room}`);

  const game = activeGames.get(room);
  if (!game) {
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  const req: Partial<AuthRequest> = {
    headers: { authorization: `Bearer ${token}` },
  };

  const res = ({
    status: () => ({
      json: (body: { message?: string }) => {
        socket.emit("error", { message: body.message || "Invalid token" });
      },
    }),
  } as unknown) as Response;

  const next = () => {
    const user = (req as AuthRequest).authorizedUser as
      | { id?: number; email?: string }
      | undefined;

    console.log(`Decoded user object for socket ${socket.id}:`, user);
    if (!user) {
      console.error(`No user object attached for socket ${socket.id}`);
      socket.emit("error", { message: "No user data in token" });
      return;
    }

    const userEmail = user.email || null;
    if (!userEmail) {
      console.error(`No valid email found in user object for socket ${socket.id}:`, user);
      socket.emit("error", { message: "No email in token" });
      return;
    }

    if (game.players.white === socket.id) {
      game.userEmails.white = userEmail;
      game.userIDs.white = user.id ?? null;
      console.log(`White player ${socket.id} authenticated, email: ${userEmail}, id: ${user.id}`);
    } else if (game.players.black === socket.id) {
      game.userEmails.black = userEmail;
      game.userIDs.black = user.id ?? null;
      console.log(`Black player ${socket.id} authenticated, email: ${userEmail}, id: ${user.id}`);
    }

    socket.emit("jwtValidated", { message: "Token validated successfully", room });
  };

  try {
    validateJWT(req as AuthRequest, res, next);
  } catch (error) {
    console.error(`Error validating JWT for socket ${socket.id}:`, error);
    socket.emit("error", { message: "Token validation failed" });
  }
};

export { handleSubmitJWT };
