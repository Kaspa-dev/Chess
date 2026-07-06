import test from "node:test";
import assert from "node:assert/strict";

import { activeGames } from "./sockets/gameStore.js";
import { handleDisconnect } from "./sockets/handlers/disconnect.js";
import { finishGame } from "./sockets/finishGame.js";

test("disconnecting from an active game awards the win to the remaining player and removes the room", async () => {
  const room = "disconnect-room";
  const finishedGames: Array<Parameters<typeof finishGame>[0]> = [];

  const io = {
    to(targetRoom: string) {
      return {
        emit(event: string, payload: unknown) {
          finishedGames.push({
            room: targetRoom,
            event,
            payload,
          } as never);
        },
      };
    },
  };

  const socket = {
    id: "white-socket",
  };

  activeGames.set(room, {
    chess: {} as never,
    players: { white: "white-socket", black: "black-socket" },
    userEmails: { white: "white@example.com", black: "black@example.com" },
    userIDs: { white: 1, black: 2 },
  });

  try {
    await handleDisconnect(io as never, socket as never, async (options) => {
      finishedGames.push(options);
      activeGames.delete(options.room);
    });

    assert.equal(finishedGames.length, 1);
    assert.equal(finishedGames[0].room, room);
    assert.equal(finishedGames[0].message, "black wins!");
    assert.equal(finishedGames[0].winnerColor, "black");
    assert.equal(activeGames.has(room), false);
  } finally {
    activeGames.delete(room);
  }
});

test("finishing a disconnect win persists the match, updates ratings, and records the winner email", async () => {
  const room = "disconnect-persistence-room";
  const emittedEvents: Array<{ room: string; event: string; payload: unknown }> = [];
  const ratingCalls: Array<{ firstPlayer: string; secondPlayer: string; winner: string }> = [];
  const savedMatches: Array<{
    user1Email: string;
    user2Email: string;
    winnerEmail: string | null;
    matchID: string;
  }> = [];

  const io = {
    to(targetRoom: string) {
      return {
        emit(event: string, payload: unknown) {
          emittedEvents.push({ room: targetRoom, event, payload });
        },
      };
    },
  };

  activeGames.set(room, {
    chess: {} as never,
    players: { white: "white-socket", black: "black-socket" },
    userEmails: { white: "white@example.com", black: "black@example.com" },
    userIDs: { white: 1, black: 2 },
  });

  try {
    const game = activeGames.get(room);
    assert.ok(game);

    await finishGame({
      room,
      game,
      io: io as never,
      message: "black wins!",
      winnerColor: "black",
      updateRatingFn: async (payload) => {
        ratingCalls.push(payload);
        return { message: "ok", newRating: 1200 };
      },
      saveMatchDataFn: async (user1Email, user2Email, winnerEmail, _time, matchID) => {
        savedMatches.push({ user1Email, user2Email, winnerEmail, matchID });
        return true;
      },
    });

    assert.deepEqual(emittedEvents, [
      {
        room,
        event: "gameOver",
        payload: {
          message: "black wins!",
          winnerEmail: "black@example.com",
        },
      },
    ]);
    assert.deepEqual(ratingCalls, [
      {
        firstPlayer: "white@example.com",
        secondPlayer: "black@example.com",
        winner: "black@example.com",
      },
    ]);
    assert.deepEqual(savedMatches, [
      {
        user1Email: "white@example.com",
        user2Email: "black@example.com",
        winnerEmail: "black@example.com",
        matchID: room,
      },
    ]);
    assert.equal(activeGames.has(room), false);
  } finally {
    activeGames.delete(room);
  }
});
