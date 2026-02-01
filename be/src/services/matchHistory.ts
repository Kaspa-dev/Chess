import { DB } from "../data-source.js";
import { User } from "../entity/User.js";
import { Match } from "../entity/Match.js";
import { Profile } from "../entity/Profile.js";
import { stat } from "fs";

const userRepository = DB.getRepository(User);
const matchRepository = DB.getRepository(Match);
const profileRepository = DB.getRepository(Profile);

const fetchMatchHistory = async (userEmail: string, userID: number) => {
    try{
        let user;
        if (userID) {
            user = await userRepository.findOneBy({id: userID});
        } else {
            user = await userRepository.findOneBy({email: userEmail})
        }

        if (!user) {
            console.log("User not found");
            return false;
        }

        const matches = await matchRepository.find({
            where: [
                { FirstPlayer: { id: user.id } },
                { SecondPlayer: { id: user.id } }

            ],
            relations: ["FirstPlayer", "SecondPlayer", "Winner", "FirstPlayer.profile", "SecondPlayer.profile"]
        });

        const formattedMatches = matches.map(match => {
            const isFirstPlayer = match.FirstPlayer.id === user.id;
            const opponent = isFirstPlayer ? match.SecondPlayer : match.FirstPlayer;

            let status = "DRAW";
            if (match.Winner) {
                status = match.Winner.id === user.id ? "WIN" : "LOSS";
            }

            return {
                date: match.StartTime.toISOString().split("T")[0],
                opponentName: opponent.profile.nickname,
                status: status
            };
        });
        return formattedMatches;

    } catch (error: any) {
        console.log(error);
        throw error;
    }
};
export default fetchMatchHistory;