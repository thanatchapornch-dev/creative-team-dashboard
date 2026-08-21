import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PIN = "1234";

async function main() {
  const pinHash = await bcrypt.hash(DEFAULT_PIN, 10);

  const members = [
    { name: "Kimji", nickname: "KIMJI", position: "Photographer", role: "MEMBER" as const, workEmail: "" },
    {
      name: "DN",
      nickname: "DN",
      position: "Team Leader / Approver",
      role: "LEADER" as const,
      workEmail: "thanatchaporn.ch@cjmart.co.th",
    },
    { name: "Toon", nickname: "TOON", position: "Video Editor", role: "MEMBER" as const, workEmail: "" },
    { name: "Witch", nickname: "WITCH", position: "Content Creator", role: "MEMBER" as const, workEmail: "" },
    { name: "Jaruju", nickname: "JARUJU", position: "Production", role: "MEMBER" as const, workEmail: "" },
  ];

  for (const m of members) {
    await prisma.member.upsert({
      where: { nickname: m.nickname },
      update: {},
      create: { ...m, pinHash },
    });
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log(`Seeded ${members.length} members. Default PIN for everyone: ${DEFAULT_PIN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
