# Game Sidebar Design

**Date:** 2026-07-06

**Goal**

Add a reusable game sidebar to the frontend chess experience that shows whose turn it is, the move list in chess notation, and captured pieces so every playable board feels more complete.

**Scope**

- Add the sidebar to all playable frontend chess pages:
  - `fe/src/pages/Singledevice.tsx`
  - `fe/src/pages/PlayerAgainstAi.tsx`
  - `fe/src/pages/PlayerAgainstPlayer.tsx`
- Show move history using SAN notation grouped by move number.
- Show a turn indicator derived from the active `Chess` state.
- Show captured pieces in two separate groups:
  - pieces White has captured
  - pieces Black has captured
- Reuse existing shared frontend patterns where possible.

**Out of Scope**

- Editing, rewinding, or replaying moves.
- Persisting move history beyond the current in-memory game session.
- Adding chess clocks, evaluation bars, or analysis features.
- Changing multiplayer socket semantics or AI move generation behavior.

**Current Situation**

The current playable pages already share a good amount of board behavior:

- `useChessGameState` owns local `Chess` state for single-device and AI modes.
- `useMultiplayerSession` exposes multiplayer game state that is already driven by the same `Chess` object shape.
- `useChessboardHighlights` provides shared square-selection and legal-move highlighting across pages.
- `GameBoardShell` already centralizes the outer board layout.

What is missing is a shared presentation layer for match context. Right now the user can see the board and end result, but not:

- whose turn it is during the game
- the running move record
- what material has been captured

That makes the match flow feel incomplete, especially when compared to a typical chess UI.

**Design Overview**

The feature will be implemented with one reusable sidebar component plus shared derived game metadata.

Shared metadata:

- Extend the existing game-state layer to expose data derived from the active `Chess` position:
  - `moveHistory`
  - `turnLabel`
  - `capturedPieces`
- Keep this metadata derived from the current board state rather than stored separately, so the UI stays in sync after resets, AI replies, and multiplayer FEN updates.

Shared presentation:

- Add a `GameSidebar` component that renders:
  - the current turn indicator at the top
  - captured-piece sections for White and Black
  - a scrollable move list using SAN notation with move numbers

Shared layout:

- Update `GameBoardShell` so it can render the board and sidebar side by side on desktop.
- Keep the chessboard visually dominant.
- Allow the layout to wrap naturally when horizontal space is tighter, so the page still works on smaller screens without needing a separate mobile-only version.

**Recommended Approach**

Use a shared metadata hook or helper behind the existing game-state interfaces, then feed one `GameSidebar` component through `GameBoardShell`.

Why this approach:

- It matches the repo's current direction toward shared board behavior.
- It keeps formatting and derived chess logic out of page components.
- It allows all three game modes to stay visually and behaviorally consistent.
- It is easier to test than duplicating sidebar computations in each page.

**Component Responsibilities**

`GameSidebar`

- Accept the current turn label, move history, and captured-piece data as props.
- Render a compact right-hand panel that visually complements the existing board shell.
- Keep section order consistent:
  1. Turn indicator
  2. Captured pieces
  3. Move list
- Use a scrollable move list region so long games do not push the rest of the page off-screen.

`GameBoardShell`

- Continue owning the outer page structure inside `MainLayout`.
- Add a sidebar slot or prop alongside the existing board and actions slots.
- Render a responsive two-column arrangement where the board stays left and the sidebar stays right on desktop-sized layouts.
- Preserve the existing result banner and action area flow beneath or around the board content.

**Game Metadata Responsibilities**

The derived metadata layer should provide:

`moveHistory`

- Generated from `game.history()` or equivalent `chess.js` move history access.
- Rendered as move pairs grouped by move number:
  - `1. e4 e5`
  - `2. Nf3 Nc6`
- Stored or exposed in a structure that makes grouped rendering straightforward.

`turnLabel`

- Derived from `game.turn()`.
- Displayed as `White to move` or `Black to move` while the game is active.
- When the game is over, the sidebar may still show the final side-to-move-derived state, but the result banner remains the primary end-state signal.

`capturedPieces`

- Derived by comparing the standard starting piece counts with the current board position.
- Exposed as two collections:
  - pieces captured by White
  - pieces captured by Black
- Ordered in a readable, chess-familiar sequence such as queen, rook, bishop, knight, pawn.

This derivation approach avoids tracking captures manually inside each move handler, which is important because:

- AI games apply both player and bot moves.
- Multiplayer games can jump from server-provided FEN updates.
- Reset flows should instantly recompute a clean empty capture state.

**Data Flow By Mode**

Single-device:

1. `Singledevice.tsx` uses `useChessGameState()`.
2. The shared game-state layer exposes board state plus derived sidebar metadata.
3. The page passes the metadata into `GameSidebar` through `GameBoardShell`.

Player vs AI:

1. `PlayerAgainstAi.tsx` uses `useChessGameState()`.
2. After the player move and the AI reply, the hook recomputes sidebar metadata from the new game state.
3. The page renders the same shared sidebar beside the board.

Player vs Player:

1. `PlayerAgainstPlayer.tsx` uses `useMultiplayerSession()`.
2. The multiplayer session continues to own socket and room behavior.
3. Multiplayer board updates already flow through the active `Chess` state, so the sidebar can derive its data from that same state without socket-specific UI logic.
4. The page renders the same shared sidebar beside the multiplayer board.

**Visual Direction**

The sidebar should feel like part of the same chess surface rather than a separate settings card.

Visual goals:

- Strong contrast with the existing board frame and dark UI elements already used on gameplay pages.
- Clear section labels.
- Easy-to-scan move rows.
- Captured pieces that are recognizable at a glance, even if rendered as text glyphs first instead of custom icons.

The board remains the focal point. The sidebar should support the match, not compete with it.

**Implementation Notes**

- Prefer extending the shared game-state contract once instead of recomputing metadata separately in each page.
- Keep the move-history formatting logic isolated from the page components.
- If `useMultiplayerSession` needs a small adaptation to expose sidebar-ready data from the current `game`, keep that change narrow and avoid mixing presentation concerns into socket lifecycle code.
- Preserve the existing board-highlight behavior and current buttons.

**Testing Strategy**

Use focused frontend tests instead of broad full-build confidence, since this repo has already had unrelated frontend noise.

Primary tests:

- `useChessGameState` or the extracted metadata helper returns:
  - SAN move history after a sequence of legal moves
  - the correct side-to-move label
  - correct captured-piece collections after exchanges
- `GameSidebar` renders:
  - the expected turn text
  - grouped SAN moves
  - separate capture sections for White and Black
- At least one page-level regression test proves the sidebar appears in a playable mode with real-looking game progress.

Suggested verification focus:

- targeted Vitest runs for the sidebar component and game-state tests
- avoid treating unrelated TypeScript build failures elsewhere as blockers to this feature if the focused tests are green

**Risks and Guardrails**

- Do not duplicate move-list or capture derivation logic across pages.
- Do not introduce a second source of truth for match history separate from `Chess`.
- Keep multiplayer support passive: the sidebar should reflect the live board state, not create new socket behavior.
- Keep the layout readable if the move list grows large.
- Avoid broad visual redesign outside the board-and-sidebar area.

**Expected Outcome**

After this feature:

- every playable chess page shows a right-hand sidebar
- players can see whose turn it is without inferring it from piece movement
- players can review the full SAN move list during the match
- players can see captured material split by side
- the gameplay UI feels more complete without changing the core rules or flows
