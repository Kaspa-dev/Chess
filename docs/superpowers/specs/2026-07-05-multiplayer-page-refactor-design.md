# Multiplayer Page Refactor Design

**Date:** 2026-07-05

**Goal**

Refactor the frontend chess game pages so `PlayerAgainstPlayer.tsx` no longer owns socket lifecycle, profile loading, chess state, opponent sync, and rendering in one file, while also removing duplicated board-area UI and local chess-state patterns from `Singledevice.tsx` and `PlayerAgainstAi.tsx`.

**Scope**

- Refactor only. No intended behavior changes.
- Keep multiplayer, AI, and single-device routes and user flows the same.
- Reuse the existing React, HeroUI, `chess.js`, `react-chessboard`, and `socket.io-client` stack.
- Preserve current page visuals unless a small markup move is required to extract a reusable component.

**Current Problems**

`fe/src/pages/PlayerAgainstPlayer.tsx` currently mixes five responsibilities:

1. Fetching the current player profile.
2. Creating and cleaning up the socket connection.
3. Managing multiplayer room and status state.
4. Applying chess moves and tracking win or stalemate outcomes.
5. Rendering the player header, invite link, board, result banner, and action button.

`fe/src/pages/Singledevice.tsx` and `fe/src/pages/PlayerAgainstAi.tsx` repeat:

- The centered game-page shell.
- The board frame.
- The result banner.
- Reset button placement and styling.
- Similar local `Chess` state handling and end-of-game state updates.

This makes the code harder to test, reason about, and extend consistently across game modes.

**Design Overview**

The refactor will separate shared presentation from mode-specific orchestration.

Shared presentation:

- `GameBoardShell` will render the common page structure around a chess board.
- `GameResultBanner` will display `White wins!`, `Black wins!`, or `It's a tie!`.
- `PlayerSummaryCard` will render the current-player and opponent profile blocks for multiplayer.
- `InviteLinkPanel` will render the shareable room link UI for multiplayer.

Shared game-state logic:

- `useChessGameState` will own the `Chess` instance, local move application helper, reset helper, and derived outcome flags for pages that need local chess-state management.

Mode-specific logic:

- `useProfileSummary` will fetch `/profiles/myprofile` and expose the current player summary used by multiplayer.
- `useMultiplayerSession` will own socket connection setup, room creation or join behavior, JWT submission, multiplayer move dispatch, opponent profile sync, room link handling, and multiplayer status text.
- `PlayerAgainstAi.tsx` will keep AI request orchestration local, but it will reuse `useChessGameState` plus shared UI components.
- `Singledevice.tsx` will use `useChessGameState` plus shared UI components.

This split keeps shared pieces focused and avoids forcing AI, local, and multiplayer modes into one overly generic control hook.

**Proposed File Structure**

Create:

- `fe/src/components/game/GameBoardShell.tsx`
- `fe/src/components/game/GameResultBanner.tsx`
- `fe/src/components/game/PlayerSummaryCard.tsx`
- `fe/src/components/game/InviteLinkPanel.tsx`
- `fe/src/hooks/game/useChessGameState.ts`
- `fe/src/hooks/game/useProfileSummary.ts`
- `fe/src/hooks/game/useMultiplayerSession.ts`
- `fe/src/components/game/GameResultBanner.test.tsx`
- `fe/src/hooks/game/useChessGameState.test.ts`

Modify:

- `fe/src/pages/PlayerAgainstPlayer.tsx`
- `fe/src/pages/PlayerAgainstAi.tsx`
- `fe/src/pages/Singledevice.tsx`

Optional if needed for test support:

- `fe/src/pages/PlayerAgainstPlayer.test.tsx`

**Component Responsibilities**

`GameBoardShell`

- Own the common centered layout inside `MainLayout`.
- Accept slots or props for the area above the board, the result banner, the board content, and the action row beneath the board.
- Keep the existing board frame styling so all pages stay visually consistent.

`GameResultBanner`

- Accept booleans for white win, black win, and stalemate.
- Render the same current strings and occupy the same role in all three pages.

`PlayerSummaryCard`

- Accept player label, avatar URL, nickname, rating, country, alignment, and optional color text.
- Render either the avatar image or `ProfileLogo` fallback using the current multiplayer design.
- Be used twice in multiplayer: current player and opponent.

`InviteLinkPanel`

- Accept the shareable URL, copy handler, and visibility conditions.
- Encapsulate the current share-link input and button markup so the multiplayer page stays composition-focused.

**Hook Responsibilities**

`useChessGameState`

- Store the active `Chess` object.
- Provide a helper to apply a move against a copy of the current FEN.
- Update `whiteWins`, `blackWins`, and `stalemate` after successful moves.
- Provide a `resetGame` helper for local modes.
- Stay generic enough for local and AI pages.

This hook should not include socket behavior or HTTP requests.

`useProfileSummary`

- Fetch the current signed-in user profile from `buildApiUrl('/profiles/myprofile')`.
- Return normalized values for nickname, avatar, rating, and country.
- Keep profile-fetch concerns out of `PlayerAgainstPlayer.tsx`.

`useMultiplayerSession`

- Read the `room` query parameter.
- Create the socket with the current `/chess/socket.io` configuration.
- Manage socket lifecycle and cleanup.
- Expose room ID, shareable link, status, player color, opponent summary, game-start flag, and event-driven board updates.
- Expose handlers for local player drops or move submission, depending on the final hook interface.

The multiplayer hook will coordinate with `useChessGameState` rather than duplicating chess-state updates in the page component.

**Data Flow**

Single-device:

1. Page calls `useChessGameState()`.
2. Page passes outcome flags into `GameResultBanner`.
3. Page renders `GameBoardShell` with the board and reset button.

AI mode:

1. Page calls `useChessGameState()`.
2. Player move is applied locally through the shared move helper.
3. AI page requests the bot move and applies it through the same shared move helper.
4. Shared board shell and result banner render the page UI.

Multiplayer mode:

1. Page calls `useProfileSummary()`.
2. Page calls `useMultiplayerSession()`.
3. Multiplayer hook handles socket events, room creation or join flow, opponent profile updates, and server-driven board FEN changes.
4. Page renders two `PlayerSummaryCard` instances, an `InviteLinkPanel` when needed, the board inside `GameBoardShell`, the shared result banner, and the existing back button.

**Testing Strategy**

Refactor confidence should come from focused frontend tests instead of a full `npm run build`, because this repo already has unrelated TypeScript noise in other pages.

Targeted tests:

- `GameResultBanner` renders the correct message for white win, black win, and stalemate states.
- `useChessGameState` applies legal moves, rejects illegal moves, and sets checkmate or stalemate flags correctly from real `chess.js` state.
- If practical, a lightweight `PlayerAgainstPlayer` composition test can mock the hooks and verify that the page renders shared subcomponents and invite or player-summary sections in the expected states.

Verification commands:

- `npm test -- GameResultBanner`
- `npm test -- useChessGameState`
- `npm test -- PlayerAgainstPlayer`

Exact command names may need to align with Vitest path filtering, but verification should remain targeted to this refactor.

**Risks and Guardrails**

- Avoid a too-generic hook that mixes multiplayer and local game concerns.
- Preserve current strings, button labels, and route behavior.
- Keep socket event semantics unchanged during extraction.
- Do not "fix" existing multiplayer behavior quirks in this ticket unless a code move requires a tiny safety adjustment with no user-visible change.
- Respect existing in-progress repo changes and avoid broad cleanup outside the touched files.

**Expected Outcome**

After the refactor:

- `PlayerAgainstPlayer.tsx` becomes a thin composition page.
- `Singledevice.tsx` and `PlayerAgainstAi.tsx` share the same board shell and result banner.
- Chess-state logic for local modes lives in one tested hook.
- Multiplayer-specific logic is isolated in a dedicated hook rather than spread across rendering code.
