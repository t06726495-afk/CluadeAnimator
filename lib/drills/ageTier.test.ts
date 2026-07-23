import { describe, expect, it } from "vitest";
import { mapTeamAgeRangeToDrillTier } from "./ageTier";
import { TEAM_AGE_RANGES, DRILL_AGE_TIERS } from "@/lib/constants/enums";

describe("mapTeamAgeRangeToDrillTier", () => {
  it("maps every team age range to a valid drill age tier", () => {
    for (const range of TEAM_AGE_RANGES) {
      expect(DRILL_AGE_TIERS).toContain(mapTeamAgeRangeToDrillTier(range));
    }
  });

  it("maps 6U and 8U to the 6U-8U tier", () => {
    expect(mapTeamAgeRangeToDrillTier("6U")).toBe("6U-8U");
    expect(mapTeamAgeRangeToDrillTier("8U")).toBe("6U-8U");
  });

  it("maps 9U-10U and 10U to the 9U-10U tier", () => {
    expect(mapTeamAgeRangeToDrillTier("9U-10U")).toBe("9U-10U");
    expect(mapTeamAgeRangeToDrillTier("10U")).toBe("9U-10U");
  });

  it("maps 12U to the 11U-12U tier", () => {
    expect(mapTeamAgeRangeToDrillTier("12U")).toBe("11U-12U");
  });

  it("maps 14U to the 13U-14U tier", () => {
    expect(mapTeamAgeRangeToDrillTier("14U")).toBe("13U-14U");
  });
});
