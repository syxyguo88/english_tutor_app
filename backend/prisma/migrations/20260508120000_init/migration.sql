-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('parent', 'child');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('draft', 'processing', 'ready_for_review', 'confirmed');

-- CreateEnum
CREATE TYPE "BookPageStatus" AS ENUM ('draft', 'confirmed');

-- CreateEnum
CREATE TYPE "TextRemovedImageStatus" AS ENUM ('not_started', 'processing', 'accepted', 'failed', 'excluded');

-- CreateEnum
CREATE TYPE "AudioSegmentStatus" AS ENUM ('draft', 'confirmed', 'excluded');

-- CreateEnum
CREATE TYPE "KnowledgeItemType" AS ENUM ('word', 'phrase', 'grammar');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('fill_blank', 'picture_sentence', 'grammar_correction', 'sentence_creation');

-- CreateEnum
CREATE TYPE "AttemptInputMode" AS ENUM ('keyboard', 'speech_to_text');

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "learningPreference" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestTag" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterestTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'draft',
    "readingDate" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookPage" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "status" "BookPageStatus" NOT NULL DEFAULT 'draft',
    "originalImageUrl" TEXT NOT NULL,
    "textRemovedImageUrl" TEXT,
    "textRemovedImageStatus" "TextRemovedImageStatus" NOT NULL DEFAULT 'not_started',
    "ocrDraft" JSONB,
    "ocrRegions" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookAudio" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "durationMs" INTEGER,
    "transcriptDraft" JSONB,
    "processingState" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "bookPageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'parent_confirmed',
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceAudioSegment" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "bookAudioId" TEXT NOT NULL,
    "startsAtMs" INTEGER NOT NULL,
    "endsAtMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,
    "status" "AudioSegmentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentenceAudioSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "type" "KnowledgeItemType" NOT NULL,
    "canonical" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeVariant" (
    "id" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "surfaceForm" TEXT NOT NULL,
    "variantKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceKnowledgeLink" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "knowledgeVariantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentenceKnowledgeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "bookId" TEXT,
    "sentenceId" TEXT,
    "type" "ExerciseType" NOT NULL,
    "prompt" JSONB NOT NULL,
    "expectedAnswer" JSONB NOT NULL,
    "targetItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "inputMode" "AttemptInputMode" NOT NULL,
    "answerText" TEXT NOT NULL,
    "aiJudgment" JSONB,
    "score" DOUBLE PRECISION,
    "errorTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uncertainty" DOUBLE PRECISION,
    "parentOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryStat" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "knowledgeVariantId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueueItem" (
    "id" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sourceReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_familyId_role_idx" ON "User"("familyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_childUserId_key" ON "ChildProfile"("childUserId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestTag_childProfileId_label_key" ON "InterestTag"("childProfileId", "label");

-- CreateIndex
CREATE INDEX "Book_familyId_status_idx" ON "Book"("familyId", "status");

-- CreateIndex
CREATE INDEX "BookPage_bookId_status_idx" ON "BookPage"("bookId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BookPage_bookId_pageOrder_key" ON "BookPage"("bookId", "pageOrder");

-- CreateIndex
CREATE INDEX "Sentence_bookPageId_confirmedAt_idx" ON "Sentence"("bookPageId", "confirmedAt");

-- CreateIndex
CREATE INDEX "SentenceAudioSegment_sentenceId_status_idx" ON "SentenceAudioSegment"("sentenceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeItem_type_canonical_key" ON "KnowledgeItem"("type", "canonical");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeVariant_id_knowledgeItemId_key" ON "KnowledgeVariant"("id", "knowledgeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeVariant_knowledgeItemId_surfaceForm_variantKind_key" ON "KnowledgeVariant"("knowledgeItemId", "surfaceForm", "variantKind");

-- CreateIndex
CREATE INDEX "SentenceKnowledgeLink_knowledgeItemId_idx" ON "SentenceKnowledgeLink"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "SentenceKnowledgeLink_knowledgeVariantId_idx" ON "SentenceKnowledgeLink"("knowledgeVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "SentenceKnowledgeLink_sentenceId_knowledgeItemId_knowledgeV_key" ON "SentenceKnowledgeLink"("sentenceId", "knowledgeItemId", "knowledgeVariantId");

-- CreateIndex
CREATE INDEX "Exercise_type_idx" ON "Exercise"("type");

-- CreateIndex
CREATE INDEX "Attempt_childUserId_createdAt_idx" ON "Attempt"("childUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MasteryStat_childProfileId_nextReviewAt_idx" ON "MasteryStat"("childProfileId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "MasteryStat_knowledgeItemId_idx" ON "MasteryStat"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "MasteryStat_knowledgeVariantId_idx" ON "MasteryStat"("knowledgeVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryStat_childProfileId_knowledgeItemId_knowledgeVariant_key" ON "MasteryStat"("childProfileId", "knowledgeItemId", "knowledgeVariantId", "exerciseType");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_childProfileId_dueAt_priority_idx" ON "ReviewQueueItem"("childProfileId", "dueAt", "priority");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestTag" ADD CONSTRAINT "InterestTag_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookPage" ADD CONSTRAINT "BookPage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAudio" ADD CONSTRAINT "BookAudio_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_bookPageId_fkey" FOREIGN KEY ("bookPageId") REFERENCES "BookPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceAudioSegment" ADD CONSTRAINT "SentenceAudioSegment_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceAudioSegment" ADD CONSTRAINT "SentenceAudioSegment_bookAudioId_fkey" FOREIGN KEY ("bookAudioId") REFERENCES "BookAudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeVariant" ADD CONSTRAINT "KnowledgeVariant_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceKnowledgeLink" ADD CONSTRAINT "SentenceKnowledgeLink_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceKnowledgeLink" ADD CONSTRAINT "SentenceKnowledgeLink_knowledgeVariantId_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeVariantId", "knowledgeItemId") REFERENCES "KnowledgeVariant"("id", "knowledgeItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryStat" ADD CONSTRAINT "MasteryStat_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryStat" ADD CONSTRAINT "MasteryStat_knowledgeVariantId_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeVariantId", "knowledgeItemId") REFERENCES "KnowledgeVariant"("id", "knowledgeItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

