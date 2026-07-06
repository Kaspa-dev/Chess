import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_ELO_MAX,
  AI_ELO_MIN,
  getAiMove,
  normalizeAiElo,
  resolveStockfishStrength,
} from "./services/stockfish.js";
import { AppError } from "./errors/AppError.js";

test("normalizeAiElo clamps values into the supported UI range", () => {
  assert.equal(normalizeAiElo(50), AI_ELO_MIN);
  assert.equal(normalizeAiElo(1600.4), 1600);
  assert.equal(normalizeAiElo(5000), AI_ELO_MAX);
});

test("resolveStockfishStrength maps low requested elo values onto a weaker stockfish setup", () => {
  assert.deepEqual(resolveStockfishStrength(200), {
    requestedElo: 200,
    useLimitedStrength: false,
    appliedElo: null,
    skillLevel: 0,
    randomMoveChance: 0.6,
  });
});

test("getAiMove returns the move plus the applied stockfish strength", async () => {
  const result = await getAiMove(
    {
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      elo: 1800,
    },
    async () => "e7e5",
  );

  assert.equal(result.move, "e7e5");
  assert.equal(result.requestedElo, 1800);
  assert.equal(result.appliedElo, 1800);
  assert.equal(result.appliedSkillLevel, 15);
});

test("getAiMove can intentionally avoid the engine best move at the weakest setting", async () => {
  const result = await getAiMove(
    {
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      elo: 200,
    },
    async () => "e7e5",
    (() => {
      const values = [0, 0];
      let index = 0;

      return () => values[index++] ?? 0;
    })(),
  );

  assert.notEqual(result.move, "e7e5");
  assert.equal(result.requestedElo, 200);
  assert.equal(result.appliedElo, null);
  assert.equal(result.appliedSkillLevel, 0);
});

test("getAiMove rejects invalid fen input", async () => {
  await assert.rejects(
    () =>
      getAiMove(
        {
          fen: "not-a-fen",
          elo: 1200,
        },
        async () => "e7e5",
      ),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.code === "VALIDATION_ERROR",
  );
});

test("getAiMove rejects invalid stockfish moves", async () => {
  await assert.rejects(
    () =>
      getAiMove(
        {
          fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
          elo: 1200,
        },
        async () => "invalid",
      ),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 502 &&
      error.code === "AI_ENGINE_ERROR",
  );
});
