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
import { ProfileLogo } from "@/components/icons";
import MainLayout from "@/layouts/main";
import "../styles/globals.css";
import { Avatar } from "@heroui/avatar";
import { getMatchHistory, type MatchHistoryEntry } from "@/services/matchApi";
import { getMyProfile } from "@/services/profileApi";
import {
    buildProfileHeaderModel,
    buildProfileResultsModel,
    DEFAULT_PROFILE_HEADER_MODEL,
    getFlagUrlFromCountryLookup,
    type CountryLookupResponse,
    type ProfileResultsModel,
} from "./profileViewModel";

interface ErrorResponse {
    message?: string;
}

interface ErrorWithResponse {
    response?: {
        data?: ErrorResponse;
    };
}

function hasErrorResponse(error: unknown): error is ErrorWithResponse {
    return typeof error === "object" && error !== null && "response" in error;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading] = React.useState<boolean>(false);

    const [profile, setProfile] = React.useState(DEFAULT_PROFILE_HEADER_MODEL);
    const [flag, setFlag] = React.useState<string>("");
    const [result, setResult] = React.useState<ProfileResultsModel>([0, 0, 0]);
    const [matchHistory, setMatchHistory] = React.useState<MatchHistoryEntry[]>([]);

    function logAxiosError(error: unknown) {
        if (hasErrorResponse(error)) {
            console.log(error.response?.data?.message);
            return;
        }

        console.log(error);
    }

    React.useEffect(() => {
        async function loadProfile() {
            try {
                const response = await getMyProfile();

                if (response?.data?.profile) {
                    console.log("Gautas res: " + response?.data?.message);
                    console.log("Gautas profilis: " + response?.data?.profile);
                    const profileModel = buildProfileHeaderModel(response.data.profile);
                    console.log("Gauta šalis " + profileModel.countryName);
                    setProfile(profileModel);

                    if (profileModel.countryName) {
                        try {
                            const countryResponse = await axios.get<CountryLookupResponse>(
                                `https://restcountries.com/v3.1/name/${encodeURIComponent(profileModel.countryName)}`
                            );
                            const flagUrl = getFlagUrlFromCountryLookup(countryResponse.data);

                            if (flagUrl) {
                                console.log(countryResponse);
                                console.log("CountryName: " + profileModel.countryName);
                                setFlag(flagUrl);
                            } else {
                                console.log("Ivyko klaida dėl vėliavos gavimo: " + countryResponse);
                            }
                        }
                        catch (error: unknown) {
                            logAxiosError(error);
                        }
                    }

                } else {
                    console.log("Ivyko klaida dėl profilio: " + response?.data?.message);
                }
            }
            catch (error: unknown) {
                logAxiosError(error);
            }

            try {
                const responseMatchHistory = await getMatchHistory();

                if (responseMatchHistory.data) {
                    const matches = responseMatchHistory.data;
                    setMatchHistory(matches);
                    setResult(buildProfileResultsModel(matches));
                }
            }
            catch (error: unknown) {
                logAxiosError(error);
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
      {profile.avatar === "null" ? (
        <ProfileLogo className="w-[200px] h-[200px]" />
      ) : (
        <Avatar
          className="w-[200px] h-[200px] rounded-none"
          src={profile.avatar}
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
          <h1 className="text-emerald-500 font-bold text-4xl">{profile.nickname}</h1>
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
        <p className="text-gray-700 dark:text-white text-xl">{profile.rating}</p>
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
