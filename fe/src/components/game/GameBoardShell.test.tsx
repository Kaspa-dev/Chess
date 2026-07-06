import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GameBoardShell } from "./GameBoardShell";

vi.mock("@/layouts/main", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("GameBoardShell", () => {
  it("keeps the board column at the intended desktop width when a sidebar is present", () => {
    render(
      <GameBoardShell
        board={<div>Board</div>}
        sidebar={<div>Sidebar</div>}
        actions={<div>Actions</div>}
      />,
    );

    const boardWrapper = screen.getByText("Board").parentElement;
    const boardColumn = boardWrapper?.parentElement;

    expect(boardWrapper).toHaveClass("w-full", "max-w-[800px]");
    expect(boardColumn).toHaveClass("w-full", "max-w-[800px]");
  });
});
