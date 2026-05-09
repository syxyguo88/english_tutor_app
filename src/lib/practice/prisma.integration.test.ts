// @vitest-environment node
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_INTEGRATION !== "1")(
  "Prisma (Postgres integration)",
  () => {
    let prisma: PrismaClient | undefined;

    beforeAll(() => {
      const url =
        process.env.INTEGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
      if (!url) {
        throw new Error(
          "Integration tests require INTEGRATION_DATABASE_URL or DATABASE_URL when RUN_INTEGRATION=1.",
        );
      }
      prisma = new PrismaClient({
        datasources: { db: { url } },
      });
    });

    afterAll(async () => {
      await prisma?.$disconnect();
    });

    it("connects, runs SELECT 1, and reads seeded prototype family", async () => {
      expect(prisma).toBeDefined();
      await prisma!.$connect();

      const ping = await prisma!.$queryRaw<{ col: number }[]>`
        SELECT 1 AS col
      `;
      expect(ping[0]?.col).toBe(1);

      const family = await prisma!.family.findUnique({
        where: { id: "prototype-family" },
      });
      expect(family).not.toBeNull();
      expect(family?.name).toBe("Prototype Family");
    });
  },
);
