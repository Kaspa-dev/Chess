import { describe, expect, it } from "vitest";

import {
  buildProfileHeaderModel,
  buildProfileResultsModel,
  getFlagUrlFromCountryLookup,
  type CountryLookupResponse,
} from "./profileViewModel";

describe("profileViewModel", () => {
  it("builds a safe profile header model from the API response", () => {
    expect(
      buildProfileHeaderModel({
        nickname: "Kaspa",
        avatar: "https://example.com/avatar.png",
        rating: 1325,
        country: "Lithuania",
      }),
    ).toEqual({
      nickname: "Kaspa",
      avatar: "https://example.com/avatar.png",
      rating: 1325,
      countryName: "Lithuania",
    });
  });

  it("falls back to the existing default country when the profile has none", () => {
    expect(
      buildProfileHeaderModel({
        nickname: "Kaspa",
        avatar: "null",
      }),
    ).toEqual({
      nickname: "Kaspa",
      avatar: "null",
      rating: 0,
      countryName: "Belgium",
    });
  });

  it("counts wins, losses, and draws for the UI model", () => {
    expect(
      buildProfileResultsModel([
        { status: "WIN", opponentName: "A", date: "2026-07-01" },
        { status: "LOSS", opponentName: "B", date: "2026-07-02" },
        { status: "DRAW", opponentName: "C", date: "2026-07-03" },
        { status: "WIN", opponentName: "D", date: "2026-07-04" },
      ]),
    ).toEqual([2, 1, 1]);
  });

  it("converts the country lookup response into a flag URL", () => {
    const lookup: CountryLookupResponse = [{ cca2: "lt" }];

    expect(getFlagUrlFromCountryLookup(lookup)).toBe(
      "https://flagsapi.com/LT/shiny/48.png",
    );
  });

  it("returns an empty flag URL when the lookup response is empty", () => {
    expect(getFlagUrlFromCountryLookup([])).toBe("");
  });
});
