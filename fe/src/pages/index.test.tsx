import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import IndexPage from "./index";

vi.mock("@/services/profileApi", () => ({
  getMyProfile: vi.fn().mockResolvedValue({
    data: {
      profile: {
        nickname: "Kaspa",
      },
    },
  }),
}));

vi.mock("@/layouts/main", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("IndexPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("reveals all game mode buttons after the intro delay", async () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>,
    );

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => {
      expect(button).toHaveClass("opacity-0");
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    screen.getAllByRole("button").forEach((button) => {
      expect(button).not.toHaveClass("opacity-0");
    });
  });
});
