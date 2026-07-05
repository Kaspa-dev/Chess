import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
