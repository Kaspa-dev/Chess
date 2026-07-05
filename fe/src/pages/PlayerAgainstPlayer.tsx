import { Chessboard } from "react-chessboard";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";

import { GameBoardShell } from "@/components/game/GameBoardShell";
import { GameResultBanner } from "@/components/game/GameResultBanner";
import { InviteLinkPanel } from "@/components/game/InviteLinkPanel";
import { PlayerSummaryCard } from "@/components/game/PlayerSummaryCard";
import { useMultiplayerSession } from "@/hooks/game/useMultiplayerSession";
import { useProfileSummary } from "@/hooks/game/useProfileSummary";

const ChessGame = () => {
    const navigate = useNavigate();
    const profile = useProfileSummary();
    const {
        gameStarted,
        color,
        shareableLink,
        game,
        whiteWins,
        blackWins,
        stalemate,
        opponent,
        onDrop,
        copyLinkToClipboard,
    } = useMultiplayerSession();

    return (
        <GameBoardShell
            header={
                <>
                    <div className="flex justify-between w-full mb-4">
                        <PlayerSummaryCard
                            label="You"
                            nickname={profile.nickname || "Loading..."}
                            avatar={profile.avatar}
                            rating={profile.rating}
                            country={profile.country}
                            colorText={color ? `Playing as: ${color}` : undefined}
                        />
                        <PlayerSummaryCard
                            label="Opponent"
                            nickname={opponent.nickname}
                            avatar={opponent.avatar}
                            rating={opponent.rating > -1 ? opponent.rating : undefined}
                            country={opponent.country}
                            colorText={color ? `Playing as: ${color === "White" ? "Black" : "White"}` : undefined}
                            align="right"
                        />
                    </div>
                    {!gameStarted && (
                        <InviteLinkPanel shareableLink={shareableLink} onCopy={copyLinkToClipboard} />
                    )}
                </>
            }
            resultBanner={
                <GameResultBanner
                    whiteWins={whiteWins}
                    blackWins={blackWins}
                    stalemate={stalemate}
                />
            }
            board={
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    boardOrientation={color === "Black" ? "black" : "white"}
                />
            }
            actions={
                <Button
                    size="lg"
                    radius="lg"
                    className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
                    onPress={() => navigate("/")}
                >
                    Back to Homepage
                </Button>
            }
        />
    );
};

export default ChessGame;
