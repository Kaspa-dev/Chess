import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Register from "./Register";

vi.mock("@/services/authApi", () => ({
  register: vi.fn(),
  sendConfirmation: vi.fn(),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUserContext: () => ({
    getAvatarUrl: vi.fn(),
  }),
}));

describe("Register", () => {
  it("uses placeholders without rendering duplicate visible field labels", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    expect(emailInput).toHaveAttribute("placeholder", "Enter your email");
    expect(passwordInput).toHaveAttribute("placeholder", "Enter your password");
    expect(confirmPasswordInput).toHaveAttribute("placeholder", "Confirm your password");
    expect(emailInput.className).toContain("dark:placeholder:text-zinc-300");
    expect(passwordInput.className).toContain("dark:placeholder:text-zinc-300");
    expect(confirmPasswordInput.className).toContain("dark:placeholder:text-zinc-300");
    expect(screen.queryByText(/^Email$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Password$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Confirm password$/i)).not.toBeInTheDocument();
  });

  it("keeps the login helper text readable in dark mode", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    const helperText = screen.getByText("Already have an account?");

    expect(helperText.className).toContain("dark:text-zinc-300");
  });
});
