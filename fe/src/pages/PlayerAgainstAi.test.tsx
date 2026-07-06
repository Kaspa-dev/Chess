import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import PlayerAgainstAi from "./PlayerAgainstAi";

const { requestAiMoveMock } = vi.hoisted(() => ({
  requestAiMoveMock: vi.fn(),
}));

vi.mock("@/services/matchApi", () => ({
  requestAiMove: requestAiMoveMock,
}));

vi.mock("@heroui/button", () => ({
  Button: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => <button onClick={onPress}>{children}</button>,
}));

vi.mock("react-chessboard", () => ({
  Chessboard: ({
    onPieceDrop,
  }: {
    onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
  }) => <button onClick={() => onPieceDrop("e2", "e4")}>Play e2e4</button>,
}));

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

vi.mock("@/components/game/GameResultBanner", () => ({
  GameResultBanner: () => <div>Game Result</div>,
}));

vi.mock("@/hooks/game/useChessboardHighlights", () => ({
  useChessboardHighlights: () => ({
    onPieceDragBegin: vi.fn(),
    onSquareClick: vi.fn(),
    customSquareStyles: {},
  }),
}));

describe("PlayerAgainstAi", () => {
  beforeEach(() => {
    requestAiMoveMock.mockReset();
    requestAiMoveMock.mockResolvedValue({ data: { move: "e7e5" } });
  });

  it("renders all supported presets and the elo slider", () => {
    render(<PlayerAgainstAi />);

    expect(screen.getByText("White to move")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expert" })).toBeInTheDocument();
    expect(screen.getByLabelText(/elo slider/i)).toBeInTheDocument();
  });

  it("uses the selected preset elo when requesting a move from the backend", async () => {
    render(<PlayerAgainstAi />);

    fireEvent.click(screen.getByRole("button", { name: "Hard" }));
    fireEvent.click(screen.getByRole("button", { name: "Play e2e4" }));

    await waitFor(() => {
      expect(requestAiMoveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          elo: 1800,
        }),
      );
    });
  });

  it("lets the slider choose a custom elo", async () => {
    render(<PlayerAgainstAi />);

    fireEvent.change(screen.getByLabelText(/elo slider/i), {
      target: { value: "950" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Play e2e4" }));

    await waitFor(() => {
      expect(requestAiMoveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          elo: 950,
        }),
      );
    });
  });

  it("snaps the slider to a preset elo when a preset is clicked", () => {
    render(<PlayerAgainstAi />);

    fireEvent.click(screen.getByRole("button", { name: "Beginner" }));

    expect(screen.getByLabelText(/elo slider/i)).toHaveValue("200");
  });
});
