-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "spendPoints" FLOAT NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "bonusPoints" FLOAT NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "totalPoints" FLOAT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Customer_totalPoints_idx" ON "Customer"("totalPoints");
