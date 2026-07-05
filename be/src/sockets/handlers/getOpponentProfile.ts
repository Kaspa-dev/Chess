import type { Socket } from "socket.io";
import { DB } from "../../data-source.js";
import { User } from "../../entity/User.js";
import { activeGames } from "../gameStore.js";

const handleGetOpponentProfile = async (
  socket: Socket,
  data: { room: string },
): Promise<void> => {
  const { room } = data;
  const game = activeGames.get(room);

  if (!game) {
    socket.emit("error", { message: "Game room not found" });
    return;
  }

  let opponentId: number | null = null;

  if (game.players.white === socket.id) {
    opponentId = game.userIDs.black;
    console.log(`Opponent for WHITE player ${socket.id} is BLACK player with ID ${opponentId}`);
  } else if (game.players.black === socket.id) {
    opponentId = game.userIDs.white;
    console.log(`Opponent for BLACK player ${socket.id} is WHITE player with ID ${opponentId}`);
  } else {
    console.error(`Socket ${socket.id} is not a player in room ${room}`);
    socket.emit("error", { message: "You are not a player in this game" });
    return;
  }

  if (!opponentId) {
    console.error(`Couldn't determine opponent ID for socket ${socket.id} in room ${room}`);
    return;
  }

  try {
    const userRepository = DB.getRepository(User);
    const opponentUser = await userRepository.findOne({
      where: { id: opponentId },
      relations: ["profile"],
    });

    if (!opponentUser || !opponentUser.profile) {
      console.error(`Profile not found for ID ${opponentId}`);
      socket.emit("error", { message: "Opponent profile not found" });
      return;
    }

    socket.emit("opponentProfile", {
      nickname: opponentUser.profile.nickname,
      avatar: opponentUser.profile.avatar || "null",
      rating: opponentUser.profile.rating || 0,
      country: opponentUser.profile.country || "null",
    });
    console.log(`Opponent profile sent to ${socket.id}: ${opponentUser.profile.nickname}`);
  } catch (error) {
    console.error("Error fetching opponent profile:", error);
    socket.emit("error", { message: "Error fetching opponent data" });
  }
};

export { handleGetOpponentProfile };
