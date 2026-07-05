interface GameResultBannerProps {
  whiteWins: boolean;
  blackWins: boolean;
  stalemate: boolean;
}

export function GameResultBanner({
  whiteWins,
  blackWins,
  stalemate,
}: GameResultBannerProps) {
  return (
    <div className="text-2xl font-bold mb-4">
      {whiteWins && "White wins!"}
      {blackWins && "Black wins!"}
      {stalemate && "It's a tie!"}
    </div>
  );
}
