import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("DevPassword123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "dev@chiklati.bank" },
    update: {},
    create: {
      email: "dev@chiklati.bank",
      passwordHash,
      name: "Dev User",
    },
  });

  console.log(`Seeded user: ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
