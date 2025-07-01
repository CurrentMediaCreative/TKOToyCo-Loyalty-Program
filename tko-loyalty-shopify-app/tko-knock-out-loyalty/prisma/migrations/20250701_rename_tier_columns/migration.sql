-- Rename minSpend to minPoints and maxSpend to maxPoints in Tier table
ALTER TABLE "Tier" RENAME COLUMN "minSpend" TO "minPoints";
ALTER TABLE "Tier" RENAME COLUMN "maxSpend" TO "maxPoints";
