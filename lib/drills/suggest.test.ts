import { describe, expect, it, vi, beforeEach } from "vitest";

type FixtureDrill = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  coachingCues: string;
  equipment: string;
  ownerUserId: string | null;
  ageTiers: { ageTier: string }[];
  skillTags: { skillLevel: string }[];
};

const FIXTURE: FixtureDrill[] = [
  {
    id: "1",
    slug: "tee-work",
    name: "Tee Height Ladder",
    category: "hitting",
    description: "",
    coachingCues: "",
    equipment: "Tee, balls",
    ownerUserId: null,
    ageTiers: [{ ageTier: "6U-8U" }],
    skillTags: [{ skillLevel: "new" }, { skillLevel: "intermediate" }, { skillLevel: "competitive" }],
  },
  {
    id: "2",
    slug: "bucket-derby",
    name: "Bucket Derby",
    category: "hitting",
    description: "",
    coachingCues: "",
    equipment: "Tee, balls, buckets",
    ownerUserId: null,
    ageTiers: [{ ageTier: "6U-8U" }],
    skillTags: [{ skillLevel: "new" }, { skillLevel: "intermediate" }, { skillLevel: "competitive" }],
  },
  {
    id: "3",
    slug: "front-toss",
    name: "Front Toss Timing Work",
    category: "hitting",
    description: "",
    coachingCues: "",
    equipment: "Balls, bats, L-screen",
    ownerUserId: null,
    ageTiers: [{ ageTier: "13U-14U" }],
    skillTags: [{ skillLevel: "new" }, { skillLevel: "intermediate" }, { skillLevel: "competitive" }],
  },
  {
    id: "4",
    slug: "live-bp-directional",
    name: "Live BP - Pull/Oppo Focus",
    category: "hitting",
    description: "",
    coachingCues: "",
    equipment: "Balls, bats, L-screen",
    ownerUserId: null,
    ageTiers: [{ ageTier: "13U-14U" }],
    skillTags: [{ skillLevel: "intermediate" }, { skillLevel: "competitive" }],
  },
  {
    id: "5",
    slug: "custom-coach-drill",
    name: "Coach's Custom Drill",
    category: "hitting",
    description: "",
    coachingCues: "",
    equipment: "",
    ownerUserId: "other-coach",
    ageTiers: [{ ageTier: "6U-8U" }],
    skillTags: [{ skillLevel: "new" }],
  },
];

const findManyMock = vi.fn(async ({ where }: { where: { category: string; ageTiers: { some: { ageTier: string } }; OR: [{ ownerUserId: null }, { ownerUserId: string }] } }) => {
  const ageTier = where.ageTiers.some.ageTier;
  const ownerUserId = where.OR[1].ownerUserId;
  return FIXTURE.filter(
    (d) =>
      d.category === where.category &&
      d.ageTiers.some((t) => t.ageTier === ageTier) &&
      (d.ownerUserId === null || d.ownerUserId === ownerUserId),
  );
});

vi.mock("@/lib/db", () => ({
  prisma: {
    drill: {
      findMany: (...args: unknown[]) => findManyMock(...(args as [never])),
    },
  },
}));

const { suggestDrillsForBlock } = await import("./suggest");

beforeEach(() => {
  findManyMock.mockClear();
});

describe("suggestDrillsForBlock", () => {
  it("scopes results by category and the team's mapped age tier", async () => {
    const results = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "8U",
      teamSkillLevel: "new",
      ownerUserId: "coach-1",
    });

    expect(results.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });

  it("returns meaningfully different suggestions for 6U-8U vs 13U-14U", async () => {
    const young = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "8U",
      teamSkillLevel: "new",
      ownerUserId: "coach-1",
    });
    const old = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "14U",
      teamSkillLevel: "competitive",
      ownerUserId: "coach-1",
    });

    const youngIds = new Set(young.map((d) => d.id));
    const oldIds = new Set(old.map((d) => d.id));
    const overlap = [...youngIds].filter((id) => oldIds.has(id));

    expect(overlap).toHaveLength(0);
    expect(young.map((d) => d.name)).not.toEqual(old.map((d) => d.name));
  });

  it("respects excludeDrillIds", async () => {
    const results = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "8U",
      teamSkillLevel: "new",
      ownerUserId: "coach-1",
      excludeDrillIds: ["1"],
    });

    expect(results.map((r) => r.id)).not.toContain("1");
    expect(results.map((r) => r.id)).toContain("2");
  });

  it("tops up from the fallback pool when the skill-matched pool is smaller than the limit", async () => {
    const results = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "14U",
      teamSkillLevel: "new",
      ownerUserId: "coach-1",
      limit: 2,
    });

    // Only drill "3" is tagged for "new" skill at 13U-14U; drill "4" is
    // intermediate/competitive only and should fill the fallback slot.
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("3");
    expect(results[1].id).toBe("4");
  });

  it("includes the coach's own custom drills alongside the global library", async () => {
    const results = await suggestDrillsForBlock({
      category: "hitting",
      teamAgeRange: "8U",
      teamSkillLevel: "new",
      ownerUserId: "other-coach",
    });

    expect(results.map((r) => r.id)).toContain("5");
  });
});
