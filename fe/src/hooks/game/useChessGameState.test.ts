import { Chess } from "chess.js";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useChessGameState } from "./useChessGameState";

describe("useChessGameState", () => {
  it("applies a legal move and updates the board", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    expect(result.current.game.get("e4")).toMatchObject({ type: "p", color: "w" });
  });

  it("rejects an illegal move", () => {
    const { result } = renderHook(() => useChessGameState());

    let moveResult = null;

    act(() => {
      moveResult = result.current.makeMove({ from: "e2", to: "e5", promotion: "q" });
    });

    expect(moveResult).toBeNull();
  });

  it("resets the board and outcome flags", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.resetGame();
    });

    expect(result.current.game.fen()).toBe(new Chess().fen());
    expect(result.current.whiteWins).toBe(false);
    expect(result.current.blackWins).toBe(false);
    expect(result.current.stalemate).toBe(false);
  });

  it("applies a later move even when an older callback reference is used", () => {
    const { result } = renderHook(() => useChessGameState());
    const staleMakeMove = result.current.makeMove;

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    let moveResult = null;

    act(() => {
      moveResult = staleMakeMove({ from: "e7", to: "e5", promotion: "q" });
    });

    expect(moveResult).not.toBeNull();
    expect(result.current.game.get("e5")).toMatchObject({ type: "p", color: "b" });
  });

  it("tracks SAN moves grouped by turn", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    act(() => {
      result.current.makeMove({ from: "e7", to: "e5", promotion: "q" });
    });

    act(() => {
      result.current.makeMove({ from: "g1", to: "f3", promotion: "q" });
    });

    expect(result.current.moveHistory).toEqual([
      { moveNumber: 1, white: "e4", black: "e5" },
      { moveNumber: 2, white: "Nf3", black: null },
    ]);
  });

  it("exposes the side to move", () => {
    const { result } = renderHook(() => useChessGameState());

    expect(result.current.turnLabel).toBe("White to move");

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    expect(result.current.turnLabel).toBe("Black to move");
  });

  it("derives captured pieces by side from the current position", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.makeMove({ from: "d7", to: "d5", promotion: "q" });
      result.current.makeMove({ from: "e4", to: "d5", promotion: "q" });
    });

    expect(result.current.capturedPieces.white).toEqual(["p"]);
    expect(result.current.capturedPieces.black).toEqual([]);
  });

  it("preserves move history when syncing to a reachable next fen", () => {
    const { result } = renderHook(() => useChessGameState());
    const syncedGame = new Chess();

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    syncedGame.move({ from: "e2", to: "e4" });
    syncedGame.move({ from: "e7", to: "e5" });

    act(() => {
      result.current.setGameFromFen(syncedGame.fen());
    });

    expect(result.current.moveHistory).toEqual([
      { moveNumber: 1, white: "e4", black: "e5" },
    ]);
    expect(result.current.turnLabel).toBe("White to move");
  });
});
