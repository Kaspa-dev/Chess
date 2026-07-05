import { useCallback, useRef, useState } from "react";
import { Chess, Move } from "chess.js";

interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

function normalizePromotion(promotion?: string) {
  return promotion && ["q", "r", "b", "n"].includes(promotion) ? promotion : undefined;
}

function getOutcomeFlags(nextGame: Chess) {
  return {
    whiteWins: nextGame.isCheckmate() && nextGame.turn() === "b",
    blackWins: nextGame.isCheckmate() && nextGame.turn() === "w",
    stalemate: nextGame.isStalemate(),
  };
}

export function useChessGameState(initialFen?: string) {
  const [game, setGame] = useState(() => new Chess(initialFen));
  const gameRef = useRef(game);
  const [whiteWins, setWhiteWins] = useState(false);
  const [blackWins, setBlackWins] = useState(false);
  const [stalemate, setStalemate] = useState(false);

  const applyOutcomeFlags = useCallback((nextGame: Chess) => {
    const outcomes = getOutcomeFlags(nextGame);
    setWhiteWins(outcomes.whiteWins);
    setBlackWins(outcomes.blackWins);
    setStalemate(outcomes.stalemate);
  }, []);

  const setGameFromFen = useCallback((fen: string) => {
    const nextGame = new Chess(fen);
    gameRef.current = nextGame;
    setGame(nextGame);
    applyOutcomeFlags(nextGame);
  }, [applyOutcomeFlags]);

  const makeMove = useCallback((move: MoveInput): Move | null => {
    const nextGame = new Chess(gameRef.current.fen());
    let result: Move | null = null;

    try {
      result = nextGame.move({
        ...move,
        promotion: normalizePromotion(move.promotion),
      });
    } catch {
      return null;
    }

    if (!result) {
      return null;
    }

    gameRef.current = nextGame;
    setGame(nextGame);
    applyOutcomeFlags(nextGame);
    return result;
  }, [applyOutcomeFlags]);

  const resetGame = useCallback(() => {
    const nextGame = new Chess(initialFen);
    gameRef.current = nextGame;
    setGame(nextGame);
    setWhiteWins(false);
    setBlackWins(false);
    setStalemate(false);
  }, [initialFen]);

  return {
    game,
    whiteWins,
    blackWins,
    stalemate,
    makeMove,
    resetGame,
    setGameFromFen,
  };
}
