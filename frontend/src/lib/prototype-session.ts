import { UserRole } from "@/domain/enums";
import { prisma } from "@/lib/db";

export type PrototypeSession = {
  familyId: string;
  parentUserId: string;
  childUserId: string;
};

type PrototypeSessionDb = {
  family: {
    upsert(input: {
      where: { id: string };
      create: { id: string; name: string };
      update: Record<string, never>;
      select: { id: true };
    }): Promise<{ id: string }>;
  };
  user: {
    upsert(input: {
      where: { id: string };
      create: {
        id: string;
        familyId: string;
        role: UserRole;
        displayName: string;
      };
      update: {
        familyId: string;
        role: UserRole;
        displayName: string;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

export async function ensurePrototypeSession(
  db?: PrototypeSessionDb,
): Promise<PrototypeSession> {
  if (!db) {
    return {
      familyId: "prototype-family",
      parentUserId: "prototype-parent",
      childUserId: "prototype-child",
    };
  }

  const activeDb = db ?? prisma;
  const family = await activeDb.family.upsert({
    where: { id: "prototype-family" },
    create: { id: "prototype-family", name: "Prototype Family" },
    update: {},
    select: { id: true },
  });

  const parent = await activeDb.user.upsert({
    where: { id: "prototype-parent" },
    create: {
      id: "prototype-parent",
      familyId: family.id,
      role: UserRole.Parent,
      displayName: "家长",
    },
    update: {
      familyId: family.id,
      role: UserRole.Parent,
      displayName: "家长",
    },
    select: { id: true },
  });

  const child = await activeDb.user.upsert({
    where: { id: "prototype-child" },
    create: {
      id: "prototype-child",
      familyId: family.id,
      role: UserRole.Child,
      displayName: "孩子",
    },
    update: {
      familyId: family.id,
      role: UserRole.Child,
      displayName: "孩子",
    },
    select: { id: true },
  });

  return {
    familyId: family.id,
    parentUserId: parent.id,
    childUserId: child.id,
  };
}
