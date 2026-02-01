import { Request, Response } from "express";
import { DB } from "../data-source.js";
import { Profile } from "../entity/Profile.js";
import fetchMatchHistory from "../services/matchHistory.js"; // Assuming this is your service to fetch match history
import { AuthRequest } from "../middleware/requestAuthorization.js";

export const getMatchHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userEmail = (req as AuthRequest).authorizedUser?.email;

        const profileId: number = Number(req.query.profileId);
        let userID = 0;

        if (profileId) {
            const profile = await DB.getRepository(Profile).findOne({
                where: { id: profileId },
                relations: ["user"]
            });

            if (!profile || !profile.user) {
                res.status(404).json({ message: "Profile not found" });
                return; 
            }

            userID = profile.user.id;
        }

        const matchHistory = await fetchMatchHistory(userEmail, userID);

        if (!matchHistory) {
            res.status(404).json({ message: "No matches found" });
            return;
        }

        res.status(200).json(matchHistory);
    } catch (error) {
        console.error("Error fetching match history:", error);
        res.status(500).json({ message: "An error occurred while fetching match history" });
    }
};
