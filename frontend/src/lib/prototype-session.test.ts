import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@/domain/enums";
import { ensurePrototypeSession } from "./prototype-session";

describe("prototype session bootstrap", () => {
  it("upserts one prototype family with parent and child users", async () => {
    const familyUpsert = vi.fn().mockResolvedValue({ id: "family_proto" });
    const userUpsert = vi
      .fn()
      .mockResolvedValueOnce({ id: "parent_proto" })
      .mockResolvedValueOnce({ id: "child_proto" });

    const session = await ensurePrototypeSession({
      family: { upsert: familyUpsert },
      user: { upsert: userUpsert },
    });

    expect(session).toEqual({
      familyId: "family_proto",
      parentUserId: "parent_proto",
      childUserId: "child_proto",
    });
    expect(familyUpsert).toHaveBeenCalledWith({
      where: { id: "prototype-family" },
      create: { id: "prototype-family", name: "Prototype Family" },
      update: {},
      select: { id: true },
    });
    expect(userUpsert).toHaveBeenNthCalledWith(1, {
      where: { id: "prototype-parent" },
      create: {
        id: "prototype-parent",
        familyId: "family_proto",
        role: UserRole.Parent,
        displayName: "家长",
      },
      update: {
        familyId: "family_proto",
        role: UserRole.Parent,
        displayName: "家长",
      },
      select: { id: true },
    });
    expect(userUpsert).toHaveBeenNthCalledWith(2, {
      where: { id: "prototype-child" },
      create: {
        id: "prototype-child",
        familyId: "family_proto",
        role: UserRole.Child,
        displayName: "孩子",
      },
      update: {
        familyId: "family_proto",
        role: UserRole.Child,
        displayName: "孩子",
      },
      select: { id: true },
    });
  });

  it("uses local prototype ids without touching Prisma when no db is injected", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://example.invalid:5432/app";

    await expect(ensurePrototypeSession()).resolves.toEqual({
      familyId: "prototype-family",
      parentUserId: "prototype-parent",
      childUserId: "prototype-child",
    });

    process.env.DATABASE_URL = previousDatabaseUrl;
  });
});
