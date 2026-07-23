import { describe, expect, it, vi, beforeEach } from "vitest";

const teamCount = vi.fn();
const practiceCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    team: { count: (...args: unknown[]) => teamCount(...args) },
    practice: { count: (...args: unknown[]) => practiceCount(...args) },
  },
}));

const { canCreateTeam, canCreatePractice, requiresPaid, FREE_TEAM_LIMIT, FREE_PRACTICE_LIMIT } =
  await import("./limits");

beforeEach(() => {
  teamCount.mockReset();
  practiceCount.mockReset();
});

describe("canCreateTeam", () => {
  it("allows a free user under the team limit", async () => {
    teamCount.mockResolvedValue(0);
    expect(await canCreateTeam({ id: "u1", plan: "free" })).toBe(true);
  });

  it("blocks a free user at the team limit", async () => {
    teamCount.mockResolvedValue(FREE_TEAM_LIMIT);
    expect(await canCreateTeam({ id: "u1", plan: "free" })).toBe(false);
  });

  it("always allows a paid user regardless of count", async () => {
    teamCount.mockResolvedValue(999);
    expect(await canCreateTeam({ id: "u1", plan: "paid" })).toBe(true);
  });
});

describe("canCreatePractice", () => {
  it("allows a free user under the practice limit", async () => {
    practiceCount.mockResolvedValue(FREE_PRACTICE_LIMIT - 1);
    expect(await canCreatePractice({ id: "u1", plan: "free" })).toBe(true);
  });

  it("blocks a free user at the practice limit", async () => {
    practiceCount.mockResolvedValue(FREE_PRACTICE_LIMIT);
    expect(await canCreatePractice({ id: "u1", plan: "free" })).toBe(false);
  });

  it("blocks a free user over the practice limit", async () => {
    practiceCount.mockResolvedValue(FREE_PRACTICE_LIMIT + 1);
    expect(await canCreatePractice({ id: "u1", plan: "free" })).toBe(false);
  });

  it("always allows a paid user regardless of count", async () => {
    practiceCount.mockResolvedValue(999);
    expect(await canCreatePractice({ id: "u1", plan: "paid" })).toBe(true);
  });
});

describe("requiresPaid", () => {
  it("is false for free users and true for paid users", () => {
    expect(requiresPaid({ plan: "free" })).toBe(false);
    expect(requiresPaid({ plan: "paid" })).toBe(true);
  });
});
