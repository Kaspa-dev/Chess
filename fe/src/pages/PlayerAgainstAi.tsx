import { useState } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@heroui/button";

import { GameBoardShell } from "@/components/game/GameBoardShell";
import { GameSidebar } from "@/components/game/GameSidebar";
import { GameResultBanner } from "@/components/game/GameResultBanner";
import { useChessboardHighlights } from "@/hooks/game/useChessboardHighlights";
import { useChessGameState } from "@/hooks/game/useChessGameState";
import { requestAiMove } from "@/services/matchApi";

const AI_PRESETS = [
  { value: "beginner", label: "Beginner", elo: 200 },
  { value: "easy", label: "Easy", elo: 800 },
  { value: "medium", label: "Medium", elo: 1200 },
  { value: "hard", label: "Hard", elo: 1800 },
  { value: "expert", label: "Expert", elo: 2400 },
] as const;

type AiPreset = (typeof AI_PRESETS)[number];
type AiPresetValue = AiPreset["value"];
const AI_ELO_MIN = 200;
const AI_ELO_MAX = 2400;
const AI_ELO_STEP = 50;

async function requestBotMove(nextFen: string, elo: number): Promise<string | null> {
  const response = await requestAiMove({
    fen: nextFen,
    elo,
  });
  const move = (response.data as { move?: string }).move;

  return typeof move === "string" && move.length >= 4 ? move : null;
}

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
  const [elo, setElo] = useState<number>(1200);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const activePreset = AI_PRESETS.find((option) => option.elo === elo)?.value ?? null;

  async function makeBotMove(nextFen: string) {
    setIsBotThinking(true);

    try {
      const move = await requestBotMove(nextFen, elo);

      if (!move) {
        return;
      }

      makeMove({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: "q",
      });
    } catch (error) {
      console.error("Error making bot move:", error);
    } finally {
      setIsBotThinking(false);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (isBotThinking || game.isGameOver()) {
      return false;
    }

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

    if (move) {
      const nextGame = new Chess(game.fen());
      nextGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion,
      });
      void makeBotMove(nextGame.fen());
    }

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
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900/80 px-5 py-3 text-white shadow-lg ring-1 ring-white/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                  AI Strength
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                  {activePreset
                    ? AI_PRESETS.find((option) => option.value === activePreset)?.label
                    : "Custom"}
                </span>
                <span className="text-sm font-semibold text-emerald-300">{elo} Elo</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {AI_PRESETS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      option.value === activePreset
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-zinc-200 hover:bg-white/20"
                    }`}
                    onClick={() => setElo(option.elo)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300" htmlFor="ai-elo">
                  Elo Slider
                </label>
                <input
                  id="ai-elo"
                  type="range"
                  min={AI_ELO_MIN}
                  max={AI_ELO_MAX}
                  step={AI_ELO_STEP}
                  value={elo}
                  onChange={(event) => setElo(Number(event.target.value))}
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{AI_ELO_MIN}</span>
                  <span>{AI_ELO_MAX}</span>
                </div>
              </div>
            </div>
          </div>

          {isBotThinking ? <p className="text-sm font-medium text-zinc-200">AI is thinking...</p> : null}

          <Button
            size="lg"
            radius="lg"
            className="bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
            onPress={() => {
              setIsBotThinking(false);
              resetGame();
            }}
          >
            Start a new game
          </Button>
        </div>
      }
    />
  );
}
