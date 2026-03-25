import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const validCategories = await prisma.category.findMany();
  const validValues = new Set(validCategories.map(c => c.value));
  const teams = await prisma.team.findMany();

  let fixed = 0;
  for (const team of teams) {
    try {
      const cats = JSON.parse(team.categories || '[]');
      const filtered = cats.filter((c: any) => validValues.has(c.value));
      if (filtered.length !== cats.length) {
        const removed = cats.filter((c: any) => !validValues.has(c.value));
        console.log(`${team.name}: removing ${removed.map((c: any) => c.value).join(', ')}`);
        await prisma.team.update({
          where: { id: team.id },
          data: { categories: JSON.stringify(filtered) },
        });
        fixed++;
      }
    } catch {
      console.log(`${team.name}: invalid categories JSON, resetting to []`);
      await prisma.team.update({
        where: { id: team.id },
        data: { categories: '[]' },
      });
      fixed++;
    }
  }

  console.log(`Done. Fixed ${fixed} of ${teams.length} teams.`);
  await prisma.$disconnect();
}

main();
