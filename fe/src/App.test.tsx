import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import App from "./App";
import { Provider } from "./provider";

vi.mock("@heroui/use-theme", () => ({
  useTheme: () => ({
    theme: "light",
  }),
}));

vi.mock("./contexts/UserContext", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUserContext: () => ({
    avatarUrl: "",
    getAvatarUrl: vi.fn(),
    resetAvatar: vi.fn(),
  }),
}));

vi.mock("./components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./components/PublicRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./pages/Singledevice", () => ({
  default: () => <div>Single Device</div>,
}));

vi.mock("./pages/Register", () => ({
  default: () => <div>Register</div>,
}));

vi.mock("./pages/Login", () => ({
  default: () => <div>Login</div>,
}));

vi.mock("./pages/Main", () => ({
  default: () => <div>Main</div>,
}));

vi.mock("./pages/Profile", () => ({
  default: () => <div>Profile</div>,
}));

vi.mock("./pages/Logout", () => ({
  Logout: () => <div>Logout</div>,
}));

vi.mock("./pages/EditProfile", () => ({
  default: () => <div>Edit Profile</div>,
}));

vi.mock("./pages/OtherProfile", () => ({
  default: () => <div>Other Profile</div>,
}));

vi.mock("./pages/PlayerAgainstAi", () => ({
  default: () => <div>Player Against AI</div>,
}));

vi.mock("./pages/settings/SettingsLayout", () => ({
  default: () => (
    <div>
      Settings Layout
      <Outlet />
    </div>
  ),
}));

vi.mock("./pages/settings/PasswordSettingsPage", () => ({
  default: () => <div>Password Settings</div>,
}));

vi.mock("./pages/settings/ThemeSettingsPage", () => ({
  default: () => <div>Theme Settings</div>,
}));

vi.mock("./pages/PlayerAgainstPlayer", () => ({
  default: () => <div>Player Against Player</div>,
}));

vi.mock("./pages/about", () => ({
  default: () => <div>About</div>,
}));

vi.mock("@/pages/index", () => ({
  default: () => <div>Index</div>,
}));

describe("App", () => {
  it("renders the password settings subpage for the base settings route", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Provider>
          <App />
        </Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Password Settings")).toBeInTheDocument();
  });

  it("renders the theme settings subpage for the theme route", () => {
    render(
      <MemoryRouter initialEntries={["/settings/themes"]}>
        <Provider>
          <App />
        </Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Theme Settings")).toBeInTheDocument();
  });

  it("renders a not found page for unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/missing-route"]}>
        <Provider>
          <App />
        </Provider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go back to the home page/i }),
    ).toHaveAttribute("href", "/main");
  });
});
