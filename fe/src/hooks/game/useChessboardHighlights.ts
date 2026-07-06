import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import type { CustomSquareStyles, Piece } from "react-chessboard/dist/chessboard/types";

interface UseChessboardHighlightsOptions {
  game: Chess;
  onMoveAttempt: (sourceSquare: string, targetSquare: string) => boolean;
}

const selectedSquareStyle = {
  boxShadow: "inset 0 0 0 4px rgba(34, 197, 94, 0.95)",
  backgroundColor: "rgba(134, 239, 172, 0.45)",
};

const legalMoveStyle = {
  background:
    "radial-gradient(circle, rgba(34, 197, 94, 0.78) 0%, rgba(34, 197, 94, 0.78) 18%, transparent 20%)",
};

function getLegalTargetSquares(game: Chess, square: string): Square[] {
  try {
    return game
      .moves({ square: square as Square, verbose: true })
      .map((move) => move.to as Square);
  } catch {
    return [];
  }
}

export function useChessboardHighlights({
  game,
  onMoveAttempt,
}: UseChessboardHighlightsOptions) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const selectSquare = useCallback(
    (square: string) => {
      const nextLegalMoves = getLegalTargetSquares(game, square);

      if (nextLegalMoves.length === 0) {
        clearSelection();
        return;
      }

      setSelectedSquare(square);
      setLegalMoves(nextLegalMoves);
    },
    [clearSelection, game],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (selectedSquare) {
        if (square === selectedSquare) {
          clearSelection();
          return;
        }

        if (legalMoves.includes(square as Square)) {
          const moveSucceeded = onMoveAttempt(selectedSquare, square);

          if (moveSucceeded) {
            clearSelection();
          }

          return;
        }
      }

      selectSquare(square);
    },
    [clearSelection, legalMoves, onMoveAttempt, selectSquare, selectedSquare],
  );

  const onPieceDragBegin = useCallback(
    (_piece: Piece, sourceSquare: string) => {
      selectSquare(sourceSquare);
    },
    [selectSquare],
  );

  const customSquareStyles = useMemo<CustomSquareStyles>(() => {
    const styles: CustomSquareStyles = {};

    if (selectedSquare) {
      styles[selectedSquare as Square] = selectedSquareStyle;
    }

    legalMoves.forEach((square) => {
      styles[square] = legalMoveStyle;
    });

    return styles;
  }, [legalMoves, selectedSquare]);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, game]);

  return {
    selectedSquare,
    customSquareStyles,
    onSquareClick,
    onPieceDragBegin,
    clearSelection,
  };
}
