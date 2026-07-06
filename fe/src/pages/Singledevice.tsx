import { Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@heroui/button";

import { GameBoardShell } from "@/components/game/GameBoardShell";
import { GameSidebar } from "@/components/game/GameSidebar";
import { GameResultBanner } from "@/components/game/GameResultBanner";
import { useChessboardHighlights } from "@/hooks/game/useChessboardHighlights";
import { useChessGameState } from "@/hooks/game/useChessGameState";

export default function PlayRandomMoveEngine(): JSX.Element {
  const {
    game,
    whiteWins,
    blackWins,
    stalemate,
    moveHistory,
    turnLabel,
    capturedPieces,
    makeMove,
    resetGame,
  } = useChessGameState();

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    const piece = game.get(sourceSquare as Square);
    let promotion: string | undefined;

    if (
      piece &&
      piece.type === "p" &&
      ((piece.color === "w" && targetSquare[1] === "8") || (piece.color === "b" && targetSquare[1] === "1"))
    ) {
      promotion = "q";
    }

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion,
    });

    return !!move;
  }

  const boardHighlights = useChessboardHighlights({
    game,
    onMoveAttempt: onDrop,
  });

  return (
    <GameBoardShell
      resultBanner={
        <GameResultBanner whiteWins={whiteWins} blackWins={blackWins} stalemate={stalemate} />
      }
      board={
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          onPieceDragBegin={boardHighlights.onPieceDragBegin}
          onSquareClick={boardHighlights.onSquareClick}
          customSquareStyles={boardHighlights.customSquareStyles}
        />
      }
      sidebar={
        <GameSidebar
          turnLabel={turnLabel}
          moveHistory={moveHistory}
          capturedPieces={capturedPieces}
        />
      }
      actions={
        <Button
          size="lg"
          radius="lg"
          className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
          onPress={resetGame}
        >
          Start a new game
        </Button>
      }
    />
  );
}
