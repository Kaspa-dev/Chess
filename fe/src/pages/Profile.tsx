import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell
} from "@heroui/table";
import { ScrollShadow } from "@heroui/scroll-shadow";
import React from "react";
import axios from "axios";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";
import { title } from "@/components/primitives";
import { ProfileLogo } from "@/components/icons";
import MainLayout from "@/layouts/main";
import "../styles/globals.css";
import { profile } from "console";
import ProfileBox from "@/components/ProfileBox"
import { Avatar } from "@heroui/avatar";

interface ProfileResponse {
    message: string,
    profile?: any,
}
interface ResponseData {
  message: string;
  newRating: number;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const [nickname, setNickname] = React.useState<string>("");
    const [country, setCountry] = React.useState<string>("Belgium");
    const [avatar, setAvatar] = React.useState<string>("null");
    const [rating, setRating] = React.useState<number>(1000);
    const [puzzles, setPuzzles] = React.useState<number>(12000);
    const [flag, setFlag] = React.useState<string>("");
    const [result, setResult] = React.useState<Object>([0,0,0]);
    const [firstPlayerEmail, setFirstPlayerEmail] = React.useState<string>("");
    const [secondPlayerEmail, setSecondPlayerEmail] = React.useState<string>("");
    const [winnerEmail, setWinnerEmail] = React.useState<string>("");
    const [matchHistory, setMatchHistory] = React.useState<Object>([]);

    const handleGameEnd = async () => {
    try {
      const response = await axios.post<ResponseData>("http://localhost:8000/match/update-rating", {
        firstPlayer: firstPlayerEmail,
        secondPlayer: secondPlayerEmail,
        winner: winnerEmail,
      });

      if (response?.data?.message) {
        console.log("Match update:", response.data.message);
        // Optionally update rating directly if returned:
        if (response.data.newRating) {
          setRating(response.data.newRating);
        }
        // Refresh the full profile to stay consistent
      } else {
        console.error("Unexpected response format:", response?.data);
      }
    } catch (error: any) {
      if (error.response) {
        console.error("Error updating rating:", error.response.data.message || "Unknown error");
      } else {
        console.error("Network or unexpected error:", error.message || "Unknown error");
      }
    }
  };

    React.useEffect(() => {
        async function loadProfile() {
            try {
                const token = localStorage.getItem("JWT");
                const response = await axios.get<ProfileResponse | undefined>("http://localhost:8000/profiles/myprofile", {
                    headers: {
                        Authorization: 'Bearer ' + token,
                    }
                });

                if (response?.data?.profile) {
                    console.log("Gautas res: " + response?.data?.message);
                    console.log("Gautas profilis: " + response?.data?.profile);
                    const countryName = response.data.profile.country;
                    console.log("Gauta šalis " + countryName)
                    setNickname(response.data.profile.nickname);
                    setCountry(countryName);
                    setAvatar(response.data.profile.avatar);
                    setRating(response.data.profile.rating);
                    setPuzzles(0);
                    

                    if (countryName != null) {
                        try {
                            const response = await axios.get<any | undefined>(`https://restcountries.com/v3.1/name/${countryName}`);

                            if (response.data) {
                                console.log(response)
                                console.log("CountryName: " + countryName);
                                const code = response.data[0].cca2.toUpperCase();
                                console.log("Pilnas kodas hopefully: " + code);
                                setFlag(`https://flagsapi.com/${code}/shiny/48.png`);
                            } else {
                                console.log("Ivyko klaida dėl vėliavos gavimo: " + response);
                            }
                        }
                        catch (error: any) {
                            console.log(error.response?.data?.message);
                        }
                    }

                } else {
                    console.log("Ivyko klaida dėl profilio: " + response?.data?.message);
                }
            }
            catch (error: any) {
                console.log(error.response?.data?.message);
            }

            try {
                const token = localStorage.getItem("JWT");
                const responseMatchHistory = await axios.get<Response | undefined>("http://localhost:8000/api/matchhistory", {
                    headers: {
                        Authorization: 'Bearer ' + token,
                    }
                });

                if (responseMatchHistory.data) {
                    console.log("Match History data: " + responseMatchHistory.data[0].date);
                    const matches = responseMatchHistory.data;
                    setMatchHistory(matches);
                    console.log("Matches data: " + matches[0].date);
                    var wins = 0;
                    var losses = 0;
                    var draws = 0;
                    for (var i = 0; i < matches.length; i++) {
                        matches[i].status === "WIN" ? wins++ : matches[i].status === "LOSS" ? losses++ : draws++;
                    }
                    console.log("Wins:" + wins + " losses:" + losses + " draws:" + draws);
                    setResult([wins, losses, draws]);
                }
            }
            catch (error: any) {
                console.log(error.responseMatchHistory?.data?.message);
            }

        }
        loadProfile();
    }, []);

    return (
<MainLayout>
<section className="flex flex-col md:flex-row flex-wrap justify-center items-start gap-6 p-4 w-full">
  {/* Profile Box */}
  <div className="w-full max-w-[900px] flex flex-col md:flex-row bg-gradient-to-r from-zinc-100 dark:from-zinc-800 to-zinc-200 dark:to-zinc-900 rounded-lg border-4 border-zinc-300 dark:border-black">
    {/* Avatar */}
    <div className="w-full md:w-[300px] flex justify-center items-center p-4">
      {avatar === "null" ? (
        <ProfileLogo className="w-[200px] h-[200px]" />
      ) : (
        <Avatar
          className="w-[200px] h-[200px] rounded-none"
          src={avatar}
          alt="Avatar"
          showFallback
          isBordered
        />
      )}
    </div>

    {/* Profile Info */}
    <div className="flex flex-col flex-grow p-4 space-y-4">
      {/* Nickname + Edit */}
      <div className="flex flex-wrap items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-emerald-500 font-bold text-4xl">{nickname}</h1>
          {flag && <img className="w-[40px] h-[40px]" src={flag} alt="flag" />}
        </div>
        <Button
          isLoading={isLoading}
          size="lg"
          radius="lg"
          className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
          onPress={() => navigate("/editprofile")}
        >
          Edit
        </Button>
      </div>

      {/* Rating */}
      <div className="p-2 flex flex-row space-x-2">
        <h1 className="text-emerald-500 font-bold text-xl">Rating:</h1>
        <p className="text-gray-700 dark:text-white text-xl">{rating}</p>
      </div>

      {/* Win/Loss/Draw */}
      <div className="p-2 flex flex-wrap gap-4">
        <div className="flex items-center space-x-1">
          <h1 className="text-emerald-500 font-bold text-xl">Wins:</h1>
          <p className="text-gray-700 dark:text-white text-xl">{result[0]}</p>
        </div>
        <div className="flex items-center space-x-1">
          <h1 className="text-red-500 font-bold text-xl">Losses:</h1>
          <p className="text-gray-700 dark:text-white text-xl">{result[1]}</p>
        </div>
        <div className="flex items-center space-x-1">
          <h1 className="text-yellow-500 font-bold text-xl">Draws:</h1>
          <p className="text-gray-700 dark:text-white text-xl">{result[2]}</p>
        </div>
      </div>

      {/* Puzzles */}
      {/*<div className="p-2 flex items-center space-x-2">*/}
      {/*  <h1 className="text-emerald-500 font-bold text-xl">Puzzles beaten:</h1>*/}
      {/*  <p className="text-gray-700 dark:text-white text-xl">{puzzles}</p>*/}
      {/*</div>*/}
    </div>
  </div>

  {/* Match History */}
  <div className="w-full max-w-[500px]">
    <h1 className="text-emerald-500 font-bold text-[25px] mb-4 ml-4">Match history</h1>
    <ScrollShadow hideScrollBar visibility={"bottom"}>
      <div className="h-[200px] overflow-auto no-scrollbar">
        <Table className="border-2 rounded-xl border-zinc-300 dark:border-black" aria-label="Match history">
          <TableHeader className="sticky top-0 bg-white z-10 text-emerald-500">
            <TableColumn className="text-emerald-500 text-[15px] font-bold w-[10px]">Result</TableColumn>
            <TableColumn className="text-emerald-500 text-[15px] font-bold">Opponent</TableColumn>
            <TableColumn className="text-emerald-500 text-[15px] font-bold">Date</TableColumn>
          </TableHeader>
          <TableBody>
            {matchHistory.map((match, idx) => (
              <TableRow key={idx}>
                <TableCell
                  className={
                    match.status === "WIN"
                      ? "text-green-600"
                      : match.status === "LOSS"
                      ? "text-red-600"
                      : "text-yellow-400"
                  }
                >
                  {match.status}
                </TableCell>
                <TableCell>{match.opponentName}</TableCell>
                <TableCell>{match.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollShadow>
  </div>
</section>
</MainLayout>
    );
}

export default Profile;