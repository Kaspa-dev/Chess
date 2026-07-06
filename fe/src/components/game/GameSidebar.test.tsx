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
