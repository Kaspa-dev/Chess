import { useCallback, useRef, useState } from "react";
import { Chess, Move } from "chess.js";

interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export type PieceCode = "q" | "r" | "b" | "n" | "p";

export interface MoveHistoryEntry {
  moveNumber: number;
  white: string | null;
  black: string | null;
}

export interface CapturedPiecesBySide {
  white: PieceCode[];
  black: PieceCode[];
}

interface GameOutcomeFlags {
  whiteWins: boolean;
  blackWins: boolean;
  stalemate: boolean;
}

const pieceOrder: PieceCode[] = ["q", "r", "b", "n", "p"];

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

function buildMoveHistory(game: Chess): MoveHistoryEntry[] {
  const sanMoves = game.history();
  const entries: MoveHistoryEntry[] = [];

  for (let index = 0; index < sanMoves.length; index += 2) {
    entries.push({
      moveNumber: index / 2 + 1,
      white: sanMoves[index] ?? null,
      black: sanMoves[index + 1] ?? null,
    });
  }

  return entries;
}

function isTrackedPiece(pieceType: string): pieceType is PieceCode {
  return pieceOrder.includes(pieceType as PieceCode);
}

function buildCapturedPieces(game: Chess): CapturedPiecesBySide {
  const currentCounts: Record<"w" | "b", Record<PieceCode, number>> = {
    w: { q: 0, r: 0, b: 0, n: 0, p: 0 },
    b: { q: 0, r: 0, b: 0, n: 0, p: 0 },
  };

  for (const row of game.board()) {
    for (const square of row) {
      if (!square || !isTrackedPiece(square.type)) {
        continue;
      }

      currentCounts[square.color][square.type] += 1;
    }
  }

  const startingCounts: Record<"w" | "b", Record<PieceCode, number>> = {
    w: { q: 1, r: 2, b: 2, n: 2, p: 8 },
    b: { q: 1, r: 2, b: 2, n: 2, p: 8 },
  };

  const white: PieceCode[] = [];
  const black: PieceCode[] = [];

  for (const piece of pieceOrder) {
    const blackMissing = startingCounts.b[piece] - currentCounts.b[piece];
    const whiteMissing = startingCounts.w[piece] - currentCounts.w[piece];

    for (let count = 0; count < blackMissing; count += 1) {
      white.push(piece);
    }

    for (let count = 0; count < whiteMissing; count += 1) {
      black.push(piece);
    }
  }

  return { white, black };
}

function cloneGameWithHistory(game: Chess, initialFen?: string) {
  const nextGame = new Chess(initialFen);
  const moveHistory = game.history({ verbose: true });

  for (const move of moveHistory) {
    nextGame.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
  }

  return nextGame;
}

function buildGameFromFen(game: Chess, targetFen: string, initialFen?: string) {
  if (game.fen() === targetFen) {
    return game;
  }

  const candidateMoves = game.history({ verbose: true }).length > 0
    ? game.moves({ verbose: true })
    : game.moves({ verbose: true });

  for (const move of candidateMoves) {
    const candidateGame = cloneGameWithHistory(game, initialFen);
    candidateGame.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    if (candidateGame.fen() === targetFen) {
      return candidateGame;
    }
  }

  return new Chess(targetFen);
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

  const setGameOutcome = useCallback((outcome: GameOutcomeFlags) => {
    setWhiteWins(outcome.whiteWins);
    setBlackWins(outcome.blackWins);
    setStalemate(outcome.stalemate);
  }, []);

  const setGameFromFen = useCallback((fen: string) => {
    const nextGame = buildGameFromFen(gameRef.current, fen, initialFen);
    gameRef.current = nextGame;
    setGame(nextGame);
    applyOutcomeFlags(nextGame);
  }, [applyOutcomeFlags, initialFen]);

  const makeMove = useCallback((move: MoveInput): Move | null => {
    const nextGame = cloneGameWithHistory(gameRef.current, initialFen);
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
  }, [applyOutcomeFlags, initialFen]);

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
    moveHistory: buildMoveHistory(game),
    turnLabel: game.turn() === "w" ? "White to move" : "Black to move",
    capturedPieces: buildCapturedPieces(game),
    makeMove,
    resetGame,
    setGameFromFen,
    setGameOutcome,
  };
}
