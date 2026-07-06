import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class MockSocket {
  id = "socket-1";
  listeners = new Map<string, Set<(...args: any[]) => void>>();
  emit = vi.fn();
  disconnect = vi.fn();

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(handler);
    return this;
  }

  off(event: string, handler: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  trigger(event: string, payload?: unknown) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.size ?? 0;
  }
}

const socketState = vi.hoisted(() => ({
  socket: null as MockSocket | null,
  ioMock: vi.fn(),
}));

const chessGameState = vi.hoisted(() => ({
  game: {
    turn: () => "w",
    get: () => null,
    fen: () => "fen",
  },
  whiteWins: false,
  blackWins: false,
  stalemate: false,
  makeMove: vi.fn(),
  resetGame: vi.fn(),
  setGameFromFen: vi.fn(),
  setGameOutcome: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  default: (...args: unknown[]) => socketState.ioMock(...args),
}));

vi.mock("@/hooks/game/useChessGameState", () => ({
  useChessGameState: () => chessGameState,
}));

import { useMultiplayerSession } from "./useMultiplayerSession";

describe("useMultiplayerSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    socketState.socket = new MockSocket();
    socketState.ioMock.mockImplementation(() => socketState.socket);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps a single opponent profile listener after jwt validation", () => {
    renderHook(() => useMultiplayerSession());

    expect(socketState.socket?.listenerCount("opponentProfile")).toBe(1);

    act(() => {
      socketState.socket?.trigger("jwtValidated", { room: "room-1" });
    });

    expect(socketState.socket?.emit).toHaveBeenCalledWith("getOpponentProfile", { room: "room-1" });
    expect(socketState.socket?.listenerCount("opponentProfile")).toBe(1);
  });

  it("handles socket gameOver events by ending the session and setting the winner outcome", () => {
    const { result } = renderHook(() => useMultiplayerSession());

    act(() => {
      socketState.socket?.trigger("gameStart", {
        room: "room-1",
        white: "socket-1",
        black: "socket-2",
        fen: "fen",
      });
    });

    act(() => {
      socketState.socket?.trigger("gameOver", {
        message: "white wins!",
        winnerEmail: "white@example.com",
      });
    });

    expect(chessGameState.setGameOutcome).toHaveBeenCalledWith({
      whiteWins: true,
      blackWins: false,
      stalemate: false,
    });
    expect(result.current.gameRoom).toBeNull();
    expect(result.current.color).toBeNull();
    expect(result.current.gameStarted).toBe(false);
  });
});
