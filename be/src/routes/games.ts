import express from "express";
import { updateRating } from "../services/game.js"; // Update with correct path
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getAiMove } from "../services/stockfish.js";

const router = express.Router();

router.post("/update-rating", asyncHandler(async (req, res) => {
  const result = await updateRating(req.body);
  res.status(200).json(result);
}));

router.post("/ai-move", asyncHandler(async (req, res) => {
  const result = await getAiMove(req.body as { fen: string; elo: number });
  res.status(200).json(result);
}));

export default router;
