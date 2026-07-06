import { Chess } from "chess.js";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useChessboardHighlights } from "./useChessboardHighlights";

describe("useChessboardHighlights", () => {
  it("highlights the selected square and its legal destinations", () => {
    const game = new Chess();
    const onMoveAttempt = vi.fn(() => true);
    const { result } = renderHook(() => useChessboardHighlights({ game, onMoveAttempt }));

    act(() => {
      result.current.onSquareClick("e2");
    });

    expect(result.current.selectedSquare).toBe("e2");
    expect(result.current.customSquareStyles.e2).toBeDefined();
    expect(result.current.customSquareStyles.e3).toBeDefined();
    expect(result.current.customSquareStyles.e4).toBeDefined();
  });

  it("moves to a highlighted target and clears the selection when the move succeeds", () => {
    const game = new Chess();
    const onMoveAttempt = vi.fn(() => true);
    const { result } = renderHook(() => useChessboardHighlights({ game, onMoveAttempt }));

    act(() => {
      result.current.onSquareClick("e2");
    });

    act(() => {
      result.current.onSquareClick("e4");
    });

    expect(onMoveAttempt).toHaveBeenCalledWith("e2", "e4");
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.customSquareStyles).toEqual({});
  });

  it("updates the selection when a different movable piece is clicked", () => {
    const game = new Chess();
    const onMoveAttempt = vi.fn(() => true);
    const { result } = renderHook(() => useChessboardHighlights({ game, onMoveAttempt }));

    act(() => {
      result.current.onSquareClick("e2");
      result.current.onSquareClick("g1");
    });

    expect(result.current.selectedSquare).toBe("g1");
    expect(result.current.customSquareStyles.f3).toBeDefined();
    expect(result.current.customSquareStyles.h3).toBeDefined();
    expect(result.current.customSquareStyles.e2).toBeUndefined();
  });

  it("shows the same highlights when a piece drag begins", () => {
    const game = new Chess();
    const onMoveAttempt = vi.fn(() => true);
    const { result } = renderHook(() => useChessboardHighlights({ game, onMoveAttempt }));

    act(() => {
      result.current.onPieceDragBegin("wP", "d2");
    });

    expect(result.current.selectedSquare).toBe("d2");
    expect(result.current.customSquareStyles.d3).toBeDefined();
    expect(result.current.customSquareStyles.d4).toBeDefined();
  });

  it("clears the selection when the board position changes externally", () => {
    const onMoveAttempt = vi.fn(() => true);
    const initialGame = new Chess();
    const { result, rerender } = renderHook(
      ({ game }) => useChessboardHighlights({ game, onMoveAttempt }),
      { initialProps: { game: initialGame } },
    );

    act(() => {
      result.current.onSquareClick("e2");
    });

    const nextGame = new Chess();
    nextGame.move({ from: "e2", to: "e4" });

    rerender({ game: nextGame });

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.customSquareStyles).toEqual({});
  });
});
