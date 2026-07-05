import { Request, Response } from "express";
import { DB } from "../data-source.js";
import { Profile } from "../entity/Profile.js";
import fetchMatchHistory from "../services/matchHistory.js"; // Assuming this is your service to fetch match history
import { AuthRequest } from "../middleware/requestAuthorization.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../errors/AppError.js";

export const getMatchHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userEmail = (req as AuthRequest).authorizedUser?.email;

        const profileId: number = Number(req.query.profileId);
        let userID = 0;

        if (profileId) {
            const profile = await DB.getRepository(Profile).findOne({
                where: { id: profileId },
                relations: ["user"]
            });

            if (!profile || !profile.user) {
                throw new AppError(404, "Profile not found", "PROFILE_NOT_FOUND");
            }

            userID = profile.user.id;
        }

        const matchHistory = await fetchMatchHistory(userEmail, userID);

        if (!matchHistory) {
            throw new AppError(404, "No matches found", "MATCH_HISTORY_NOT_FOUND");
        }

        res.status(200).json(matchHistory);
});
