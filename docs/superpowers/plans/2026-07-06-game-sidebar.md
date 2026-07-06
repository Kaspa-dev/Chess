# Game Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable right-hand chess sidebar across all playable game pages that shows SAN move history, captured pieces split by side, and a turn indicator derived from the live `Chess` state.

**Architecture:** Extend the shared game-state layer with derived sidebar metadata, render that metadata through a new `GameSidebar` component, and thread it through `GameBoardShell` so `Singledevice.tsx`, `PlayerAgainstAi.tsx`, and `PlayerAgainstPlayer.tsx` all use the same board-plus-sidebar layout. Keep `Chess` as the single source of truth so local moves, AI replies, multiplayer FEN updates, and resets all recompute the sidebar consistently.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, `chess.js`, `react-chessboard`, HeroUI, Tailwind CSS

---

### File Map

**Create:**
- `fe/src/components/game/GameSidebar.tsx`
- `fe/src/components/game/GameSidebar.test.tsx`

**Modify:**
- `fe/src/hooks/game/useChessGameState.ts`
- `fe/src/hooks/game/useChessGameState.test.ts`
- `fe/src/components/game/GameBoardShell.tsx`
- `fe/src/pages/Singledevice.tsx`
- `fe/src/pages/PlayerAgainstAi.tsx`
- `fe/src/pages/PlayerAgainstPlayer.tsx`
- `fe/src/pages/PlayerAgainstAi.test.tsx`

**Optional only if multiplayer page coverage is needed:**
- `fe/src/pages/PlayerAgainstPlayer.test.tsx`

### Task 1: Add sidebar metadata to the shared chess-state hook

**Files:**
- Modify: `fe/src/hooks/game/useChessGameState.ts`
- Modify: `fe/src/hooks/game/useChessGameState.test.ts`

- [ ] **Step 1: Write the failing hook tests for SAN history, turn label, and captures**

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useChessGameState } from "./useChessGameState";

describe("useChessGameState sidebar metadata", () => {
  it("tracks SAN moves grouped by turn", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.makeMove({ from: "e7", to: "e5", promotion: "q" });
      result.current.makeMove({ from: "g1", to: "f3", promotion: "q" });
    });

    expect(result.current.moveHistory).toEqual([
      { moveNumber: 1, white: "e4", black: "e5" },
      { moveNumber: 2, white: "Nf3", black: null },
    ]);
  });

  it("exposes the side to move", () => {
    const { result } = renderHook(() => useChessGameState());

    expect(result.current.turnLabel).toBe("White to move");

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    expect(result.current.turnLabel).toBe("Black to move");
  });

  it("derives captured pieces by side from the board position", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.makeMove({ from: "d7", to: "d5", promotion: "q" });
      result.current.makeMove({ from: "e4", to: "d5", promotion: "q" });
    });

    expect(result.current.capturedPieces.white).toEqual(["p"]);
    expect(result.current.capturedPieces.black).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the hook test to verify it fails**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts`

Expected: FAIL because `moveHistory`, `turnLabel`, and `capturedPieces` do not exist on the hook result yet.

- [ ] **Step 3: Extend `useChessGameState.ts` with derived sidebar metadata**

Add these types and helpers near the top of `fe/src/hooks/game/useChessGameState.ts`:

```ts
type PieceCode = "q" | "r" | "b" | "n" | "p";

interface MoveHistoryEntry {
  moveNumber: number;
  white: string | null;
  black: string | null;
}

interface CapturedPiecesBySide {
  white: PieceCode[];
  black: PieceCode[];
}

const pieceOrder: PieceCode[] = ["q", "r", "b", "n", "p"];

function buildMoveHistory(game: Chess): MoveHistoryEntry[] {
  const sanMoves = game.history();
  const entries: MoveHistoryEntry[] = [];

  for (let index = 0; index < sanMoves.length; index += 2) {
    entries.push({
      moveNumber: index / 2 + 1,
      white: sanMoves[index] ?? null,
      black: sanMoves[index + 1] ?? null,
    });
  }

  return entries;
}

function buildCapturedPieces(game: Chess): CapturedPiecesBySide {
  const currentCounts = {
    w: { q: 0, r: 0, b: 0, n: 0, p: 0 },
    b: { q: 0, r: 0, b: 0, n: 0, p: 0 },
  };

  for (const row of game.board()) {
    for (const square of row) {
      if (!square) {
        continue;
      }

      if (square.type === "k") {
        continue;
      }

      currentCounts[square.color][square.type] += 1;
    }
  }

  const startingCounts = {
    w: { q: 1, r: 2, b: 2, n: 2, p: 8 },
    b: { q: 1, r: 2, b: 2, n: 2, p: 8 },
  };

  const white: PieceCode[] = [];
  const black: PieceCode[] = [];

  for (const piece of pieceOrder) {
    const blackMissing = startingCounts.b[piece] - currentCounts.b[piece];
    const whiteMissing = startingCounts.w[piece] - currentCounts.w[piece];

    for (let count = 0; count < blackMissing; count += 1) {
      white.push(piece);
    }

    for (let count = 0; count < whiteMissing; count += 1) {
      black.push(piece);
    }
  }

  return { white, black };
}
```

Return the derived values from the hook:

```ts
  return {
    game,
    whiteWins,
    blackWins,
    stalemate,
    moveHistory: buildMoveHistory(game),
    turnLabel: game.turn() === "w" ? "White to move" : "Black to move",
    capturedPieces: buildCapturedPieces(game),
    makeMove,
    resetGame,
    setGameFromFen,
  };
```

- [ ] **Step 4: Update the existing hook test file to keep current coverage and add the new assertions**

Append the new tests to `fe/src/hooks/game/useChessGameState.test.ts` and keep the current stale-callback regression test intact:

```ts
  it("tracks SAN moves grouped by turn", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.makeMove({ from: "e7", to: "e5", promotion: "q" });
      result.current.makeMove({ from: "g1", to: "f3", promotion: "q" });
    });

    expect(result.current.moveHistory).toEqual([
      { moveNumber: 1, white: "e4", black: "e5" },
      { moveNumber: 2, white: "Nf3", black: null },
    ]);
  });

  it("derives captured pieces by side from the current position", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.makeMove({ from: "d7", to: "d5", promotion: "q" });
      result.current.makeMove({ from: "e4", to: "d5", promotion: "q" });
    });

    expect(result.current.capturedPieces.white).toEqual(["p"]);
    expect(result.current.capturedPieces.black).toEqual([]);
    expect(result.current.turnLabel).toBe("Black to move");
  });
```

- [ ] **Step 5: Run the hook test to verify it passes**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts`

Expected: PASS with the previous hook tests plus the new sidebar metadata tests all green.

- [ ] **Step 6: Commit**

```bash
git add fe/src/hooks/game/useChessGameState.ts fe/src/hooks/game/useChessGameState.test.ts
git commit -m "feat: derive chess sidebar metadata"
```

### Task 2: Build and test the reusable game sidebar component

**Files:**
- Create: `fe/src/components/game/GameSidebar.tsx`
- Create: `fe/src/components/game/GameSidebar.test.tsx`

- [ ] **Step 1: Write the failing sidebar component test**

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameSidebar } from "./GameSidebar";

describe("GameSidebar", () => {
  it("renders the turn label, captured sections, and SAN move list", () => {
    render(
      <GameSidebar
        turnLabel="Black to move"
        capturedPieces={{ white: ["q", "p"], black: ["n"] }}
        moveHistory={[
          { moveNumber: 1, white: "e4", black: "c5" },
          { moveNumber: 2, white: "Nf3", black: null },
        ]}
      />,
    );

    expect(screen.getByText("Black to move")).toBeInTheDocument();
    expect(screen.getByText("White captured")).toBeInTheDocument();
    expect(screen.getByText("Black captured")).toBeInTheDocument();
    expect(screen.getByText("1. e4 c5")).toBeInTheDocument();
    expect(screen.getByText("2. Nf3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- src/components/game/GameSidebar.test.tsx`

Expected: FAIL with a module not found error for `GameSidebar`.

- [ ] **Step 3: Create `GameSidebar.tsx` with compact sections**

```tsx
interface MoveHistoryEntry {
  moveNumber: number;
  white: string | null;
  black: string | null;
}

interface CapturedPiecesBySide {
  white: string[];
  black: string[];
}

interface GameSidebarProps {
  turnLabel: string;
  moveHistory: MoveHistoryEntry[];
  capturedPieces: CapturedPiecesBySide;
}

const pieceSymbols: Record<string, string> = {
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
  p: "P",
};

function renderCapturedPieces(pieces: string[]) {
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
```

- [ ] **Step 4: Run the sidebar test to verify it passes**

Run: `npm test -- src/components/game/GameSidebar.test.tsx`

Expected: PASS with the sidebar rendering test green.

- [ ] **Step 5: Commit**

```bash
git add fe/src/components/game/GameSidebar.tsx fe/src/components/game/GameSidebar.test.tsx
git commit -m "feat: add reusable chess game sidebar"
```

### Task 3: Update the board shell to support a shared right-hand sidebar

**Files:**
- Modify: `fe/src/components/game/GameBoardShell.tsx`

- [ ] **Step 1: Add a failing layout-focused assertion in an existing page test**

Modify `fe/src/pages/PlayerAgainstAi.test.tsx` so the mocked `GameBoardShell` expects a `sidebar` prop:

```tsx
vi.mock("@/components/game/GameBoardShell", () => ({
  GameBoardShell: ({
    header,
    board,
    sidebar,
    actions,
  }: {
    header?: React.ReactNode;
    board: React.ReactNode;
    sidebar?: React.ReactNode;
    actions: React.ReactNode;
  }) => (
    <div>
      {header}
      {board}
      {sidebar}
      {actions}
    </div>
  ),
}));
```

Add this assertion to one of the existing tests:

```tsx
expect(screen.getByText("White to move")).toBeInTheDocument();
```

- [ ] **Step 2: Run the AI page test to verify it fails**

Run: `npm test -- src/pages/PlayerAgainstAi.test.tsx`

Expected: FAIL because the page does not pass sidebar content into `GameBoardShell` yet.

- [ ] **Step 3: Extend `GameBoardShell.tsx` with a sidebar slot and two-column layout**

Update `fe/src/components/game/GameBoardShell.tsx` to:

```tsx
import type { ReactNode } from "react";

import MainLayout from "@/layouts/main";

interface GameBoardShellProps {
  header?: ReactNode;
  resultBanner?: ReactNode;
  board: ReactNode;
  sidebar?: ReactNode;
  actions: ReactNode;
}

export function GameBoardShell({
  header,
  resultBanner,
  board,
  sidebar,
  actions,
}: GameBoardShellProps) {
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[1240px] flex-col items-center gap-6">
          {header}
          {resultBanner}

          <div className="flex w-full flex-wrap items-start justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[800px] border-5 border-zinc-400">{board}</div>
              {actions}
            </div>

            {sidebar}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 4: Re-run the AI page test and expect it to still fail on the missing page wiring**

Run: `npm test -- src/pages/PlayerAgainstAi.test.tsx`

Expected: FAIL, but now only because `PlayerAgainstAi.tsx` still needs to pass the new sidebar prop.

- [ ] **Step 5: Commit**

```bash
git add fe/src/components/game/GameBoardShell.tsx fe/src/pages/PlayerAgainstAi.test.tsx
git commit -m "feat: support shared game sidebar layout"
```

### Task 4: Wire the sidebar into all playable pages

**Files:**
- Modify: `fe/src/pages/Singledevice.tsx`
- Modify: `fe/src/pages/PlayerAgainstAi.tsx`
- Modify: `fe/src/pages/PlayerAgainstPlayer.tsx`

- [ ] **Step 1: Update `Singledevice.tsx` to pass sidebar metadata**

Import the new component:

```tsx
import { GameSidebar } from "@/components/game/GameSidebar";
```

Destructure the new metadata from the hook:

```tsx
const {
  game,
  whiteWins,
  blackWins,
  stalemate,
  moveHistory,
  turnLabel,
  capturedPieces,
  makeMove,
  resetGame,
} = useChessGameState();
```

Pass the sidebar into `GameBoardShell`:

```tsx
      sidebar={
        <GameSidebar
          turnLabel={turnLabel}
          moveHistory={moveHistory}
          capturedPieces={capturedPieces}
        />
      }
```

- [ ] **Step 2: Update `PlayerAgainstAi.tsx` the same way**

Add the import:

```tsx
import { GameSidebar } from "@/components/game/GameSidebar";
```

Extend the hook destructure:

```tsx
const {
  game,
  whiteWins,
  blackWins,
  stalemate,
  moveHistory,
  turnLabel,
  capturedPieces,
  makeMove,
  resetGame,
} = useChessGameState();
```

Pass the sidebar:

```tsx
      sidebar={
        <GameSidebar
          turnLabel={turnLabel}
          moveHistory={moveHistory}
          capturedPieces={capturedPieces}
        />
      }
```

- [ ] **Step 3: Extend `useMultiplayerSession()` and update `PlayerAgainstPlayer.tsx` to use the same sidebar-ready contract**

Because `useMultiplayerSession()` already wraps `useChessGameState()`, extend its return value so `PlayerAgainstPlayer.tsx` can consume the same metadata names as the local game pages.

Update the hook destructure in `fe/src/hooks/game/useMultiplayerSession.ts`:

```ts
  const {
    game,
    whiteWins,
    blackWins,
    stalemate,
    moveHistory,
    turnLabel,
    capturedPieces,
    makeMove,
    resetGame,
    setGameFromFen,
  } = useChessGameState();
```

Return the metadata from the hook:

```ts
  return {
    game,
    gameStarted,
    status,
    color,
    gameRoom,
    shareableLink,
    whiteWins,
    blackWins,
    stalemate,
    moveHistory,
    turnLabel,
    capturedPieces,
    opponent,
    onDrop,
    copyLinkToClipboard,
  };
```

Then update `fe/src/pages/PlayerAgainstPlayer.tsx`.

Import the component:

```tsx
import { GameSidebar } from "@/components/game/GameSidebar";
```

Destructure the metadata from `useMultiplayerSession()`:

```tsx
const {
  gameStarted,
  color,
  shareableLink,
  game,
  whiteWins,
  blackWins,
  stalemate,
  moveHistory,
  turnLabel,
  capturedPieces,
  opponent,
  onDrop,
  copyLinkToClipboard,
} = useMultiplayerSession();
```

Pass the shared sidebar values into `GameBoardShell`:

```tsx
      sidebar={
        <GameSidebar
          turnLabel={turnLabel}
          moveHistory={moveHistory}
          capturedPieces={capturedPieces}
        />
      }
```

- [ ] **Step 4: Run focused page and hook verification**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts src/components/game/GameSidebar.test.tsx src/pages/PlayerAgainstAi.test.tsx`

Expected: PASS with hook, sidebar, and AI page regression coverage green.

- [ ] **Step 5: If the multiplayer page has no useful test yet, add a narrow regression test**

Create or extend `fe/src/pages/PlayerAgainstPlayer.test.tsx` only if needed. The narrow test should mock `useMultiplayerSession()` and assert the sidebar receives live values:

```tsx
expect(screen.getByText("Black to move")).toBeInTheDocument();
expect(screen.getByText("1. e4 e5")).toBeInTheDocument();
```

- [ ] **Step 6: Commit**

```bash
git add fe/src/pages/Singledevice.tsx fe/src/pages/PlayerAgainstAi.tsx fe/src/pages/PlayerAgainstPlayer.tsx fe/src/pages/PlayerAgainstAi.test.tsx
git commit -m "feat: show chess sidebar across playable boards"
```

### Task 5: Final verification and change review

**Files:**
- Modify only the files touched in Tasks 1-4 if final polish is required

- [ ] **Step 1: Run the full targeted verification set**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts src/components/game/GameSidebar.test.tsx src/pages/PlayerAgainstAi.test.tsx`

Expected: PASS. If a multiplayer page test was added in Task 4, include it in the same command and expect PASS.

- [ ] **Step 2: Inspect the changed file list**

Run: `git status --short`

Expected: Only the intended sidebar files plus any unrelated pre-existing workspace changes that were already present before this feature work.

- [ ] **Step 3: Sanity-check the implementation against the spec**

```text
Confirm the final code matches the approved spec:
- right-hand shared sidebar exists on all playable pages
- move list uses SAN notation grouped by move number
- turn indicator is derived from live Chess state
- captured pieces are split into White-captured and Black-captured groups
```

- [ ] **Step 4: Commit final cleanup only if a polish patch was needed after verification**

```bash
git add fe/src/components/game/GameSidebar.tsx fe/src/components/game/GameBoardShell.tsx fe/src/hooks/game/useChessGameState.ts fe/src/pages/Singledevice.tsx fe/src/pages/PlayerAgainstAi.tsx fe/src/pages/PlayerAgainstPlayer.tsx
git commit -m "test: verify chess game sidebar integration"
```
