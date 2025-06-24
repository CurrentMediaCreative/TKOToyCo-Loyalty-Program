-- AlterTable
ALTER TABLE "PointEvent" ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0,
                         ADD COLUMN "pointsAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
                         ADD COLUMN "lastUsed" TIMESTAMP(3);
