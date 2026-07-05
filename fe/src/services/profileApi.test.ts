import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: getMock,
    patch: patchMock,
  },
}));

describe("profileApi", () => {
  beforeEach(() => {
    getMock.mockReset();
    patchMock.mockReset();
  });

  it("loads the signed-in player's profile through the shared client", async () => {
    const { getMyProfile } = await import("./profileApi");

    await getMyProfile();

    expect(getMock).toHaveBeenCalledWith("/profiles/myprofile");
  });

  it("loads another player's profile with the expected query params", async () => {
    const { getProfileById } = await import("./profileApi");

    await getProfileById("42");

    expect(getMock).toHaveBeenCalledWith("/profiles/profile", {
      params: { id: "42" },
    });
  });

  it("uploads avatars with multipart form data through the shared client", async () => {
    const { uploadAvatar } = await import("./profileApi");
    const formData = new FormData();

    await uploadAvatar(formData);

    expect(patchMock).toHaveBeenCalledWith("/profiles/uploadavatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  });
});
