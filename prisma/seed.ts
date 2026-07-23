import { PrismaClient } from "@prisma/client";
import { DRILL_SEED } from "./seed-data/drills";

const prisma = new PrismaClient();

async function main() {
  for (const entry of DRILL_SEED) {
    const drill = await prisma.drill.upsert({
      where: { slug: entry.slug },
      create: {
        slug: entry.slug,
        name: entry.name,
        category: entry.category,
        description: entry.description,
        coachingCues: entry.coachingCues,
        equipment: entry.equipment,
        diagramType: entry.diagramType ?? null,
        ownerUserId: null,
      },
      update: {
        name: entry.name,
        category: entry.category,
        description: entry.description,
        coachingCues: entry.coachingCues,
        equipment: entry.equipment,
        diagramType: entry.diagramType ?? null,
      },
    });

    await prisma.drillAgeTier.deleteMany({ where: { drillId: drill.id } });
    await prisma.drillAgeTier.createMany({
      data: entry.ageTiers.map((ageTier) => ({ drillId: drill.id, ageTier })),
    });

    await prisma.drillSkillLevel.deleteMany({ where: { drillId: drill.id } });
    await prisma.drillSkillLevel.createMany({
      data: entry.skillLevels.map((skillLevel) => ({
        drillId: drill.id,
        skillLevel,
      })),
    });
  }

  console.log(`Seeded ${DRILL_SEED.length} drills.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
