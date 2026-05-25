import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(`Found ${categories.length} categories`);

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    if (c.code) {
      console.log(`SKIP ${c.name} — already has code: ${c.code}`);
      continue;
    }
    const code = `CATE${String(i + 1).padStart(3, "0")}`;
    await prisma.category.update({ where: { id: c.id }, data: { code } });
    console.log(`ASSIGNED ${c.name} → ${code}`);
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
