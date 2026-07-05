import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Login from "./Login";

vi.mock("@/services/authApi", () => ({
  login: vi.fn(),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUserContext: () => ({
    getAvatarUrl: vi.fn(),
  }),
}));

describe("Login", () => {
  it("marks credential fields to avoid browser autofilling old saved values", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute("autocomplete", "off");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
  });

  it("uses placeholders without rendering duplicate visible field labels", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute("placeholder", "Enter your email");
    expect(passwordInput).toHaveAttribute("placeholder", "Enter your password");
    expect(emailInput.className).toContain("dark:placeholder:text-zinc-300");
    expect(passwordInput.className).toContain("dark:placeholder:text-zinc-300");
    expect(screen.queryByText(/^Email$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Password$/)).not.toBeInTheDocument();
  });

  it("keeps the register helper text readable in dark mode", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const helperText = screen.getByText("Don't have an account yet?");

    expect(helperText.className).toContain("dark:text-zinc-300");
  });

  it("marks the email field as filled when the user types", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });

    await user.type(emailInput, "a");

    expect(emailInput).toHaveValue("a");
    expect(emailInput.closest('[data-slot="base"]')).toHaveAttribute("data-filled", "true");
  });
});
