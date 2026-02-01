import { DB } from "../data-source.js";
import { User } from "../entity/User.js";
import { Match } from "../entity/Match.js";
import { Profile } from "../entity/Profile.js";

const userRepository = DB.getRepository(User);
const matchRepository = DB.getRepository(Match);
const profileRepository = DB.getRepository(Profile);

const saveMatchData = async (user1Email: string, user2Email: string, winnerEmail: string | null, time: Date, matchID: string): Promise<boolean> => {
    try{
        const user1 = await userRepository.findOneBy({email: user1Email});
        const user2 = await userRepository.findOneBy({email: user2Email});

        if (!user1 || !user2) {
            console.log("User not found");
            return false;
        }

        const winner = winnerEmail ? await userRepository.findOneBy({email: winnerEmail}) : null;

        const newMatch = matchRepository.create({
            MatchID: matchID,
            FirstPlayer: user1,
            SecondPlayer: user2,
            Winner: winner,
            StartTime: time
        });
    
        await matchRepository.save(newMatch);
        return true;
    } catch (error: any) {
        console.log(error);
        throw error;
    }
};

const updateRating = async (bodyData: any) => {
    const { firstPlayer, secondPlayer, winner } = bodyData;

    if (!firstPlayer || !secondPlayer) {
        return { message: "Both players emails should be given" };
    }

    if (firstPlayer == secondPlayer) {
        return { message: "Both players emails should be different" };
    }

    try {
        const user1 = await userRepository.findOne({
            where: { email: firstPlayer },
            relations: ["profile"],
        });
        const player1 = user1?.profile;
        if (!player1) {
            return { message: "First player's profile doesn't exist" };
        }

        const user2 = await userRepository.findOne({
            where: { email: secondPlayer },
            relations: ["profile"],
        });
        const player2 = user2?.profile;
        if (!player2) {
            return { message: "Second player's profile doesn't exist" };
        }

        if (!winner) {
            return { message: "The result of the match is a draw" };
        }

        if (winner != firstPlayer && winner != secondPlayer) {
            return { message: "The email of the winner does not match neither of the given players emails" };
        }

        if (winner == firstPlayer) {
            !player1?.rating || player1?.rating == 0 ? player1.rating = 20 : player1.rating += 20;
            !player2?.rating || player2?.rating == 0 ? player2.rating = 0 : player2.rating -= 10;
        }

        if (winner == secondPlayer) {
            !player2?.rating || player2?.rating == 0 ? player2.rating = 20 : player2.rating += 20;
            !player1?.rating || player1?.rating == 0 ? player1.rating = 0 : player1.rating -= 10;
        }

        await profileRepository.save(user1.profile);
        await profileRepository.save(user2.profile);
        return {
            message: "Rating update successful: " + firstPlayer + " rating = " + player1.rating
            + ", " + secondPlayer + " rating = " + player2.rating,
            newRating: winner === firstPlayer ? player1.rating : player2.rating // or return both ratings if needed
        };
    } catch (error) {
        console.error("Rating update error:", error);
    }
};

export { saveMatchData };
export { updateRating };