import { useState } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@heroui/button";
import axios from 'axios';
import MainLayout from "@/layouts/main";

export default function PlayRandomMoveEngine(): JSX.Element {
  const [game, setGame] = useState(new Chess());
  const [whiteWins, setWhiteWin] = useState(false);
  const [blackWins, setBlackWin] = useState(false);
  const [stalemate, setStalemate] = useState(false);

  const [isBotThinking, setIsBotThinking] = useState(false);

  async function makeBotMove() {
    setIsBotThinking(true);  // Bot is thinking
    try {
      const response = await axios.post('https://chess-api.com/v1', {
        fen: game.fen(),
      });

      const move = (response.data as { move: string }).move;  // Get the bot's move
      const moveResult = makeAMove({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: "q", // Always promote to a queen
      });

      // If the bot's move is successful, update the game state
      if (moveResult) {
        game.move(moveResult); // Update the game state with the bot's move
        setGame(game);
        setIsBotThinking(false); // Bot has finished thinking
      }
    } catch (error) {
      console.error("Error making bot move:", error);
      setIsBotThinking(false);
    }
  }

  function makeAMove(move: { from: string; to: string; promotion?: string }): Move | null {
    const gameCopy = new Chess(game.fen()); // Create a new Chess instance with the current game state
    const result = gameCopy.move(move); // Make the move on the new game instance

    if (result) {
        game.move(move);
        setGame(gameCopy); // Update state only if the move is legal
    }

    // Check for game end conditions
    if (gameCopy.isStalemate()) setStalemate(true);
    if (gameCopy.isCheckmate() && gameCopy.turn() === 'b') setWhiteWin(true);
    else if (gameCopy.isCheckmate() && gameCopy.turn() === 'w') setBlackWin(true);
    return result;
  }

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Always promote to a queen
    });
    
    // After the player makes a move, let the bot make its move
    if (move) {
      setGame(game)
      makeBotMove()  // Give time for bot to "think"
    }

    return true;
  }

  return (
    <MainLayout>
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold mb-4">
          {whiteWins && "White wins!"}
          {blackWins && "Black wins!"}
          {stalemate && "It's a tie!"}
        </div>
        <div className="w-[800px] border-5 border-zinc-400 ">
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>
        <Button
          size="lg"
          radius="lg"
          className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
          onPress={() => {
            setGame(new Chess());
            setWhiteWin(false);
            setBlackWin(false);
            setStalemate(false);
            setIsBotThinking(false);
          }}
        >
          Start a new game
        </Button>
      </div>
    </div>
    </MainLayout>
  );
}
