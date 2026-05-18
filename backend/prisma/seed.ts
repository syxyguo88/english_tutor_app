import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const family = await prisma.family.upsert({
    where: { id: "prototype-family" },
    create: { id: "prototype-family", name: "Prototype Family" },
    update: { name: "Prototype Family" },
  });

  await prisma.user.upsert({
    where: { id: "prototype-parent" },
    create: {
      id: "prototype-parent",
      familyId: family.id,
      role: UserRole.parent,
      displayName: "家长",
    },
    update: {
      familyId: family.id,
      role: UserRole.parent,
      displayName: "家长",
    },
  });

  await prisma.user.upsert({
    where: { id: "prototype-child" },
    create: {
      id: "prototype-child",
      familyId: family.id,
      role: UserRole.child,
      displayName: "孩子",
    },
    update: {
      familyId: family.id,
      role: UserRole.child,
      displayName: "孩子",
    },
  });

  await prisma.childProfile.upsert({
    where: { childUserId: "prototype-child" },
    create: {
      childUserId: "prototype-child",
      grade: "G1",
    },
    update: {
      grade: "G1",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
