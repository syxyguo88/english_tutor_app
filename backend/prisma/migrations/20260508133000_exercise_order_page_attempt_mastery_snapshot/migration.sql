-- Align Exercise with ingestion-backed drafts and stable ordering (see prisma/schema.prisma comments).
ALTER TABLE "Exercise" ADD COLUMN "pageId" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "createdOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Exercise_createdOrder_idx" ON "Exercise"("createdOrder");

-- Snapshot fields so recent-attempt / feedback lists match post-submit mastery without re-deriving history.
ALTER TABLE "Attempt" ADD COLUMN "masteryScoreAfter" INTEGER;
ALTER TABLE "Attempt" ADD COLUMN "nextReviewAtAfter" TIMESTAMP(3);
