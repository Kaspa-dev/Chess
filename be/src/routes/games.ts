import express from "express";
import { updateRating } from "../services/game.js"; // Update with correct path
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.post('/match/update-rating', asyncHandler(async (req, res) => {
  const result = await updateRating(req.body);
  res.status(200).json(result);
}));

export default router;
