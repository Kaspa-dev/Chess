# Multiplayer Page Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the chess game pages so multiplayer logic is split into focused hooks and components, while AI and single-device pages reuse the same shared board-area UI and local chess-state helpers without changing behavior.

**Architecture:** Extract shared presentation into `src/components/game`, extract shared local chess-state into `src/hooks/game/useChessGameState.ts`, and isolate multiplayer-only profile and socket orchestration in dedicated hooks. Keep each route page as a thin composition layer that wires the right hook outputs into shared UI.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, `chess.js`, `react-chessboard`, HeroUI, `socket.io-client`, Axios

---

### File Map

**Create:**
- `fe/src/components/game/GameBoardShell.tsx`
- `fe/src/components/game/GameResultBanner.tsx`
- `fe/src/components/game/PlayerSummaryCard.tsx`
- `fe/src/components/game/InviteLinkPanel.tsx`
- `fe/src/components/game/GameResultBanner.test.tsx`
- `fe/src/hooks/game/useChessGameState.ts`
- `fe/src/hooks/game/useChessGameState.test.ts`
- `fe/src/hooks/game/useProfileSummary.ts`
- `fe/src/hooks/game/useMultiplayerSession.ts`

**Modify:**
- `fe/src/pages/PlayerAgainstPlayer.tsx`
- `fe/src/pages/PlayerAgainstAi.tsx`
- `fe/src/pages/Singledevice.tsx`

**Optional if composition mocking is needed:**
- `fe/src/pages/PlayerAgainstPlayer.test.tsx`

### Task 1: Extract and test the shared result banner

**Files:**
- Create: `fe/src/components/game/GameResultBanner.tsx`
- Test: `fe/src/components/game/GameResultBanner.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";

import { GameResultBanner } from "./GameResultBanner";

describe("GameResultBanner", () => {
  it("shows the white win message", () => {
    render(<GameResultBanner whiteWins blackWins={false} stalemate={false} />);

    expect(screen.getByText("White wins!")).toBeInTheDocument();
  });

  it("shows the black win message", () => {
    render(<GameResultBanner whiteWins={false} blackWins stalemate={false} />);

    expect(screen.getByText("Black wins!")).toBeInTheDocument();
  });

  it("shows the tie message", () => {
    render(<GameResultBanner whiteWins={false} blackWins={false} stalemate />);

    expect(screen.getByText("It's a tie!")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx`

Expected: FAIL with a module not found error for `GameResultBanner`.

- [ ] **Step 3: Write the minimal component**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx`

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add fe/src/components/game/GameResultBanner.tsx fe/src/components/game/GameResultBanner.test.tsx
git commit -m "refactor: extract shared game result banner"
```

### Task 2: Extract and test shared local chess-state logic

**Files:**
- Create: `fe/src/hooks/game/useChessGameState.ts`
- Test: `fe/src/hooks/game/useChessGameState.test.ts`

- [ ] **Step 1: Write the failing hook test**

```ts
import { act, renderHook } from "@testing-library/react";

import { useChessGameState } from "./useChessGameState";

describe("useChessGameState", () => {
  it("applies a legal move and updates the board", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    expect(result.current.game.fen()).toContain("4P3");
  });

  it("rejects an illegal move", () => {
    const { result } = renderHook(() => useChessGameState());

    let moveResult = null;

    act(() => {
      moveResult = result.current.makeMove({ from: "e2", to: "e5", promotion: "q" });
    });

    expect(moveResult).toBeNull();
  });

  it("resets the board and outcome flags", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.game.fen()).toBe(new (require("chess.js").Chess)().fen());
    expect(result.current.whiteWins).toBe(false);
    expect(result.current.blackWins).toBe(false);
    expect(result.current.stalemate).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts`

Expected: FAIL with a module not found error for `useChessGameState`.

- [ ] **Step 3: Write the hook**

```ts
import { useState } from "react";
import { Chess, Move } from "chess.js";

interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

function getValidatedPromotion(promotion?: string) {
  return promotion && ["q", "r", "b", "n"].includes(promotion) ? promotion : undefined;
}

export function useChessGameState(initialFen?: string) {
  const [game, setGame] = useState(() => new Chess(initialFen));
  const [whiteWins, setWhiteWins] = useState(false);
  const [blackWins, setBlackWins] = useState(false);
  const [stalemate, setStalemate] = useState(false);

  const applyOutcomeFlags = (nextGame: Chess) => {
    setWhiteWins(nextGame.isCheckmate() && nextGame.turn() === "b");
    setBlackWins(nextGame.isCheckmate() && nextGame.turn() === "w");
    setStalemate(nextGame.isStalemate());
  };

  const setGameFromFen = (fen: string) => {
    const nextGame = new Chess(fen);
    setGame(nextGame);
    applyOutcomeFlags(nextGame);
  };

  const makeMove = (move: MoveInput): Move | null => {
    const nextGame = new Chess(game.fen());
    const result = nextGame.move({
      ...move,
      promotion: getValidatedPromotion(move.promotion),
    });

    if (!result) {
      return null;
    }

    setGame(nextGame);
    applyOutcomeFlags(nextGame);
    return result;
  };

  const resetGame = () => {
    const nextGame = new Chess(initialFen);
    setGame(nextGame);
    setWhiteWins(false);
    setBlackWins(false);
    setStalemate(false);
  };

  return {
    game,
    whiteWins,
    blackWins,
    stalemate,
    makeMove,
    resetGame,
    setGameFromFen,
  };
}
```

- [ ] **Step 4: Update the test to avoid CommonJS-only assertions**

```ts
import { Chess } from "chess.js";
import { act, renderHook } from "@testing-library/react";

import { useChessGameState } from "./useChessGameState";

describe("useChessGameState", () => {
  it("applies a legal move and updates the board", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
    });

    expect(result.current.game.get("e4")).toMatchObject({ type: "p", color: "w" });
  });

  it("rejects an illegal move", () => {
    const { result } = renderHook(() => useChessGameState());

    let moveResult = null;

    act(() => {
      moveResult = result.current.makeMove({ from: "e2", to: "e5", promotion: "q" });
    });

    expect(moveResult).toBeNull();
  });

  it("resets the board and outcome flags", () => {
    const { result } = renderHook(() => useChessGameState());

    act(() => {
      result.current.makeMove({ from: "e2", to: "e4", promotion: "q" });
      result.current.resetGame();
    });

    expect(result.current.game.fen()).toBe(new Chess().fen());
    expect(result.current.whiteWins).toBe(false);
    expect(result.current.blackWins).toBe(false);
    expect(result.current.stalemate).toBe(false);
  });
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/hooks/game/useChessGameState.test.ts`

Expected: PASS with 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add fe/src/hooks/game/useChessGameState.ts fe/src/hooks/game/useChessGameState.test.ts
git commit -m "refactor: extract shared chess game state hook"
```

### Task 3: Extract shared board-shell and multiplayer display components

**Files:**
- Create: `fe/src/components/game/GameBoardShell.tsx`
- Create: `fe/src/components/game/PlayerSummaryCard.tsx`
- Create: `fe/src/components/game/InviteLinkPanel.tsx`
- Modify: `fe/src/pages/Singledevice.tsx`
- Modify: `fe/src/pages/PlayerAgainstAi.tsx`

- [ ] **Step 1: Write the shared board shell**

```tsx
import { ReactNode } from "react";
import MainLayout from "@/layouts/main";

interface GameBoardShellProps {
  header?: ReactNode;
  resultBanner?: ReactNode;
  board: ReactNode;
  actions: ReactNode;
}

export function GameBoardShell({
  header,
  resultBanner,
  board,
  actions,
}: GameBoardShellProps) {
  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          {header}
          {resultBanner}
          <div className="w-[800px] border-5 border-zinc-400">{board}</div>
          {actions}
        </div>
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Write the multiplayer-only display helpers**

```tsx
import { Avatar } from "@heroui/avatar";

import { ProfileLogo } from "@/components/icons";

interface PlayerSummaryCardProps {
  label: string;
  nickname: string;
  avatar: string;
  rating?: number;
  country?: string;
  colorText?: string;
  align?: "left" | "right";
}

export function PlayerSummaryCard({
  label,
  nickname,
  avatar,
  rating,
  country,
  colorText,
  align = "left",
}: PlayerSummaryCardProps) {
  const isRightAligned = align === "right";

  return (
    <div className="flex items-center gap-4">
      {isRightAligned ? (
        <div>
          <p className="font-semibold text-right">{label}: {nickname}</p>
          <div className="flex gap-2 text-sm justify-end">
            {rating !== undefined && <span>Rating: {rating}</span>}
            {country && <span>| {country}</span>}
          </div>
          {colorText && <p className="text-sm text-right">{colorText}</p>}
        </div>
      ) : (
        <div>
          <p className="font-semibold">{label}: {nickname}</p>
          <div className="flex gap-2 text-sm">
            {rating !== undefined && <span>Rating: {rating}</span>}
            {country && <span>| {country}</span>}
          </div>
          {colorText && <p className="text-sm">{colorText}</p>}
        </div>
      )}
      <div className="w-12 h-12">
        {avatar === "null" ? (
          <ProfileLogo className="w-full h-full" />
        ) : (
          <Avatar className="w-full h-full" src={avatar} showFallback isBordered />
        )}
      </div>
    </div>
  );
}
```

```tsx
import { Button } from "@heroui/button";

interface InviteLinkPanelProps {
  shareableLink: string;
  onCopy: () => void;
}

export function InviteLinkPanel({ shareableLink, onCopy }: InviteLinkPanelProps) {
  if (!shareableLink) {
    return null;
  }

  return (
    <div className="my-4 flex flex-row items-center align-center gap-x-4">
      <p>Share this link to invite a player:</p>
      <input type="text" value={shareableLink} readOnly className="border p-2 w-full" />
      <Button
        size="sm"
        radius="lg"
        className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
        onPress={onCopy}
      >
        Copy Link
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Refactor `Singledevice.tsx` to use shared UI**

```tsx
<GameBoardShell
  resultBanner={
    <GameResultBanner
      whiteWins={whiteWins}
      blackWins={blackWins}
      stalemate={stalemate}
    />
  }
  board={<Chessboard position={game.fen()} onPieceDrop={onDrop} />}
  actions={
    <Button
      size="lg"
      radius="lg"
      className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
      onPress={resetGame}
    >
      Start a new game
    </Button>
  }
/>
```

- [ ] **Step 4: Refactor `PlayerAgainstAi.tsx` to use shared UI**

```tsx
<GameBoardShell
  resultBanner={
    <GameResultBanner
      whiteWins={whiteWins}
      blackWins={blackWins}
      stalemate={stalemate}
    />
  }
  board={<Chessboard position={game.fen()} onPieceDrop={onDrop} />}
  actions={
    <Button
      size="lg"
      radius="lg"
      className="mt-10 bg-gradient-to-tr from-stone-700 to-green-500 text-white shadow-lg font-semibold"
      onPress={resetGame}
    >
      Start a new game
    </Button>
  }
/>
```

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx src/hooks/game/useChessGameState.test.ts`

Expected: PASS with all current shared-component and hook tests green.

- [ ] **Step 6: Commit**

```bash
git add fe/src/components/game/GameBoardShell.tsx fe/src/components/game/PlayerSummaryCard.tsx fe/src/components/game/InviteLinkPanel.tsx fe/src/pages/Singledevice.tsx fe/src/pages/PlayerAgainstAi.tsx
git commit -m "refactor: share game board layout across local modes"
```

### Task 4: Extract multiplayer profile and socket orchestration

**Files:**
- Create: `fe/src/hooks/game/useProfileSummary.ts`
- Create: `fe/src/hooks/game/useMultiplayerSession.ts`
- Modify: `fe/src/pages/PlayerAgainstPlayer.tsx`

- [ ] **Step 1: Extract the current profile loader**

```ts
import { useEffect, useState } from "react";
import axios from "axios";

import { buildApiUrl } from "@/config/api";

interface ProfileSummary {
  nickname: string;
  avatar: string;
  rating: number;
  country: string;
}

export function useProfileSummary() {
  const [profile, setProfile] = useState<ProfileSummary>({
    nickname: "",
    avatar: "null",
    rating: 0,
    country: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("JWT");
      const response = await axios.get(buildApiUrl("/profiles/myprofile"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const nextProfile = response.data?.profile;

      if (!nextProfile) {
        return;
      }

      setProfile({
        nickname: nextProfile.nickname,
        avatar: nextProfile.avatar,
        rating: nextProfile.rating || 0,
        country: nextProfile.country || "",
      });
    };

    void fetchProfile();
  }, []);

  return profile;
}
```

- [ ] **Step 2: Extract multiplayer socket and room state**

```ts
import { useEffect, useMemo, useState } from "react";
import io from "socket.io-client";

import { apiBaseUrl } from "@/config/api";
import { useChessGameState } from "@/hooks/game/useChessGameState";

export function useMultiplayerSession() {
  const initialRoom = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
  }, []);

  const {
    game,
    whiteWins,
    blackWins,
    stalemate,
    makeMove,
    setGameFromFen,
  } = useChessGameState();
  const [status, setStatus] = useState("Connecting...");
  const [color, setColor] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameRoom, setGameRoom] = useState<string | null>(initialRoom);
  const [shareableLink, setShareableLink] = useState("");
  const [opponent, setOpponent] = useState({
    nickname: "Waiting for opponent...",
    avatar: "null",
    rating: -1,
    country: "",
  });

  useEffect(() => {
    const socket = io(apiBaseUrl, {
      path: "/chess/socket.io",
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      if (initialRoom) {
        socket.emit("joinRoom", { room: initialRoom });
        setStatus("Joining game...");
      } else {
        setStatus("Creating game room...");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [initialRoom]);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    return !!move;
  };

  const copyLinkToClipboard = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
    }
  };

  return {
    game,
    whiteWins,
    blackWins,
    stalemate,
    status,
    color,
    gameStarted,
    gameRoom,
    shareableLink,
    opponent,
    onDrop,
    copyLinkToClipboard,
    setGameFromFen,
    setStatus,
    setColor,
    setGameStarted,
    setGameRoom,
    setShareableLink,
    setOpponent,
  };
}
```

- [ ] **Step 3: Rebuild `PlayerAgainstPlayer.tsx` as a composition page**

```tsx
const profile = useProfileSummary();
const {
  status,
  color,
  gameStarted,
  shareableLink,
  opponent,
  game,
  whiteWins,
  blackWins,
  stalemate,
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
```

- [ ] **Step 4: Run focused multiplayer verification**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx src/hooks/game/useChessGameState.test.ts`

Expected: PASS. If a composition test is added, include it in the same run and expect PASS.

- [ ] **Step 5: Run lint or TypeScript verification only if the touched files can be isolated cleanly**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx src/hooks/game/useChessGameState.test.ts`

Expected: PASS. Do not rely on `npm run build` if unrelated pages still fail TypeScript checks.

- [ ] **Step 6: Commit**

```bash
git add fe/src/hooks/game/useProfileSummary.ts fe/src/hooks/game/useMultiplayerSession.ts fe/src/pages/PlayerAgainstPlayer.tsx
git commit -m "refactor: split multiplayer page into hooks and components"
```

### Task 5: Final verification and cleanup

**Files:**
- Modify: any touched frontend files from Tasks 1-4 only if final polish is required

- [ ] **Step 1: Run the full targeted test set**

Run: `npm test -- src/components/game/GameResultBanner.test.tsx src/hooks/game/useChessGameState.test.ts`

Expected: PASS with the shared refactor test coverage green.

- [ ] **Step 2: Inspect the changed file list**

Run: `git status --short`

Expected: Only the intended frontend refactor files plus any pre-existing unrelated repo changes.

- [ ] **Step 3: Summarize any residual risk**

```text
Residual risk should be limited to multiplayer runtime event wiring because it is covered mostly by extraction discipline and targeted tests, not by end-to-end socket tests.
```

- [ ] **Step 4: Commit final cleanup if needed**

```bash
git add fe/src/components/game fe/src/hooks/game fe/src/pages/PlayerAgainstPlayer.tsx fe/src/pages/PlayerAgainstAi.tsx fe/src/pages/Singledevice.tsx
git commit -m "test: verify refactored chess game page structure"
```
