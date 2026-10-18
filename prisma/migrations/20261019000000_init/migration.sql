-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('LINKEDIN', 'REFERRAL', 'WEBSITE', 'JOB_BOARD', 'OTHER');

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'APPLIED',
    "source" "Source" NOT NULL DEFAULT 'OTHER',
    "skills" TEXT[],
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fromStage" "Stage",
    "toStage" "Stage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE INDEX "Candidate_stage_idx" ON "Candidate"("stage");

-- CreateIndex
CREATE INDEX "Candidate_createdAt_idx" ON "Candidate"("createdAt");

-- CreateIndex
CREATE INDEX "StageHistory_candidateId_idx" ON "StageHistory"("candidateId");

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

