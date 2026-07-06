import { Chess } from "chess.js";
import { spawn } from "node:child_process";
import fs from "node:fs";

import { stockfishConfig } from "../config.js";
import { AppError } from "../errors/AppError.js";

export const AI_ELO_MIN = 200;
export const AI_ELO_MAX = 2400;
const STOCKFISH_ELO_MIN = 1320;
const STOCKFISH_ELO_MAX = 3190;
const STOCKFISH_SKILL_MIN = 0;
const STOCKFISH_SKILL_MAX = 20;
const BESTMOVE_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export interface AiMoveRequest {
  fen: string;
  elo: number;
}

export interface StockfishStrength {
  requestedElo: number;
  useLimitedStrength: boolean;
  appliedElo: number | null;
  skillLevel: number;
  randomMoveChance: number;
}

interface StockfishRunRequest {
  enginePath: string;
  fen: string;
  moveTimeMs: number;
  timeoutMs: number;
  strength: StockfishStrength;
}

type StockfishRunner = (request: StockfishRunRequest) => Promise<string>;
type RandomNumberGenerator = () => number;

export function normalizeAiElo(elo: number): number {
  if (!Number.isFinite(elo)) {
    throw new AppError(400, "AI Elo must be a valid number", "VALIDATION_ERROR", {
      field: "elo",
    });
  }

  return Math.max(AI_ELO_MIN, Math.min(AI_ELO_MAX, Math.round(elo)));
}

export function resolveStockfishStrength(elo: number): StockfishStrength {
  const requestedElo = normalizeAiElo(elo);
  const skillLevel = Math.round(
    ((requestedElo - AI_ELO_MIN) / (AI_ELO_MAX - AI_ELO_MIN)) *
      (STOCKFISH_SKILL_MAX - STOCKFISH_SKILL_MIN),
  );
  const useLimitedStrength = requestedElo >= STOCKFISH_ELO_MIN;
  const randomMoveChance = Math.max(
    0,
    Math.min(0.6, (STOCKFISH_ELO_MIN - requestedElo) / (STOCKFISH_ELO_MIN - AI_ELO_MIN)),
  );

  return {
    requestedElo,
    useLimitedStrength,
    appliedElo: useLimitedStrength
      ? Math.max(
          STOCKFISH_ELO_MIN,
          Math.min(STOCKFISH_ELO_MAX, requestedElo),
        )
      : null,
    skillLevel: Math.max(
      STOCKFISH_SKILL_MIN,
      Math.min(STOCKFISH_SKILL_MAX, skillLevel),
    ),
    randomMoveChance,
  };
}

export async function getAiMove(
  request: AiMoveRequest,
  runner: StockfishRunner = runStockfish,
  random: RandomNumberGenerator = Math.random,
) {
  if (typeof request.fen !== "string" || !request.fen.trim()) {
    throw new AppError(400, "FEN is required", "VALIDATION_ERROR", {
      field: "fen",
    });
  }

  const fen = request.fen.trim();
  const strength = resolveStockfishStrength(request.elo);

  let game: Chess;

  try {
    game = new Chess(fen);
  } catch {
    throw new AppError(400, "FEN is invalid", "VALIDATION_ERROR", {
      field: "fen",
    });
  }

  if (game.isGameOver()) {
    throw new AppError(400, "Cannot request an AI move for a finished game", "VALIDATION_ERROR", {
      field: "fen",
    });
  }

  const engineMove = await runner({
    enginePath: stockfishConfig.enginePath,
    fen,
    moveTimeMs: stockfishConfig.moveTimeMs,
    timeoutMs: stockfishConfig.timeoutMs,
    strength,
  });

  if (!BESTMOVE_PATTERN.test(engineMove)) {
    throw new AppError(502, "Stockfish returned an invalid move", "AI_ENGINE_ERROR");
  }

  const move = maybeChooseFallbackMove(game, engineMove, strength, random);

  return {
    move,
    requestedElo: strength.requestedElo,
    appliedElo: strength.appliedElo,
    appliedSkillLevel: strength.skillLevel,
  };
}

function maybeChooseFallbackMove(
  game: Chess,
  engineMove: string,
  strength: StockfishStrength,
  random: RandomNumberGenerator,
): string {
  if (strength.randomMoveChance <= 0 || random() >= strength.randomMoveChance) {
    return engineMove;
  }

  const legalMoves = game.moves({ verbose: true });
  const alternativeMoves = legalMoves.filter((move) => toUciMove(move) !== engineMove);

  if (alternativeMoves.length === 0) {
    return engineMove;
  }

  const pool = alternativeMoves.filter((move) => !move.captured);
  const candidateMoves = pool.length > 0 ? pool : alternativeMoves;
  const selectedMove = candidateMoves[Math.floor(random() * candidateMoves.length)];

  return toUciMove(selectedMove);
}

function toUciMove(move: {
  from: string;
  to: string;
  promotion?: string;
}): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

async function runStockfish(request: StockfishRunRequest): Promise<string> {
  assertStockfishExists(request.enginePath);

  return new Promise((resolve, reject) => {
    const engine = spawn(request.enginePath, [], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let phase: "waiting-for-uci" | "waiting-for-ready" | "waiting-for-move" =
      "waiting-for-uci";
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      callback();

      if (!engine.killed) {
        engine.kill();
      }
    };

    const timeoutId = setTimeout(() => {
      finish(() => {
        reject(new AppError(504, "Stockfish did not return a move in time", "AI_ENGINE_TIMEOUT"));
      });
    }, request.timeoutMs);

    engine.once("error", (error) => {
      finish(() => {
        reject(new AppError(500, `Failed to start Stockfish: ${error.message}`, "AI_ENGINE_ERROR"));
      });
    });

    engine.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
    });

    engine.once("close", (code) => {
      if (settled) {
        return;
      }

      finish(() => {
        reject(
          new AppError(
            502,
            `Stockfish exited before returning a move${code === null ? "" : ` (code ${code})`}`,
            "AI_ENGINE_ERROR",
            stderrBuffer.trim() ? { stderr: stderrBuffer.trim() } : undefined,
          ),
        );
      });
    });

    engine.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
          continue;
        }

        if (line === "uciok" && phase === "waiting-for-uci") {
          phase = "waiting-for-ready";
          engine.stdin.write(
            `setoption name Skill Level value ${request.strength.skillLevel}\n`,
          );
          engine.stdin.write(
            `setoption name UCI_LimitStrength value ${request.strength.useLimitedStrength}\n`,
          );

          if (request.strength.useLimitedStrength && request.strength.appliedElo !== null) {
            engine.stdin.write(
              `setoption name UCI_Elo value ${request.strength.appliedElo}\n`,
            );
          }

          engine.stdin.write("isready\n");
          continue;
        }

        if (line === "readyok" && phase === "waiting-for-ready") {
          phase = "waiting-for-move";
          engine.stdin.write(`position fen ${request.fen}\n`);
          engine.stdin.write(`go movetime ${request.moveTimeMs}\n`);
          continue;
        }

        if (line.startsWith("bestmove ")) {
          const move = line.split(/\s+/)[1] ?? "";

          finish(() => {
            resolve(move);
          });
        }
      }
    });

    engine.stdin.write("uci\n");
  });
}

function assertStockfishExists(enginePath: string) {
  if (fs.existsSync(enginePath)) {
    return;
  }

  throw new AppError(500, `Stockfish executable not found at ${enginePath}`, "AI_ENGINE_ERROR");
}
