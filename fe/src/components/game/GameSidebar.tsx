import type { CapturedPiecesBySide, MoveHistoryEntry, PieceCode } from "@/hooks/game/useChessGameState";

interface GameSidebarProps {
  turnLabel: string;
  moveHistory: MoveHistoryEntry[];
  capturedPieces: CapturedPiecesBySide;
}

const pieceSymbols: Record<PieceCode, string> = {
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
  p: "P",
};

function renderCapturedPieces(pieces: PieceCode[]) {
  if (pieces.length === 0) {
    return <span className="text-zinc-400">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pieces.map((piece, index) => (
        <span
          key={`${piece}-${index}`}
          className="rounded-full bg-white/10 px-2 py-1 text-sm font-semibold text-zinc-100"
        >
          {pieceSymbols[piece]}
        </span>
      ))}
    </div>
  );
}

export function GameSidebar({
  turnLabel,
  moveHistory,
  capturedPieces,
}: GameSidebarProps) {
  return (
    <aside className="w-full max-w-[320px] rounded-3xl bg-zinc-950/85 p-5 text-white shadow-2xl ring-1 ring-white/10">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Turn</p>
        <p className="mt-2 text-lg font-bold text-emerald-300">{turnLabel}</p>
      </div>

      <div className="mb-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">White captured</p>
          <div className="mt-2">{renderCapturedPieces(capturedPieces.white)}</div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Black captured</p>
          <div className="mt-2">{renderCapturedPieces(capturedPieces.black)}</div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Moves</p>
        <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {moveHistory.length === 0 ? (
            <p className="text-sm text-zinc-400">No moves yet.</p>
          ) : (
            moveHistory.map((entry) => (
              <div
                key={entry.moveNumber}
                className="rounded-2xl bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100"
              >
                {entry.moveNumber}. {entry.white}
                {entry.black ? ` ${entry.black}` : ""}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
