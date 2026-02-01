import express from "express";
import { getMatchHistory } from "../controllers/matchHistoryController.js";
import authenticateJWT from "../middleware/requestAuthorization.js";

const router = express.Router();

router.get("/matchhistory", authenticateJWT, getMatchHistory);

export default router;