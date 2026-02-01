import express from "express";
import { updateRating } from "../services/game.js"; // Update with correct path

const router = express.Router();

router.post('/match/update-rating', async (router, res) => {
  try {
    const result = await updateRating(router.body);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Server error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;