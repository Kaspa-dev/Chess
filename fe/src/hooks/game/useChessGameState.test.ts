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
});
