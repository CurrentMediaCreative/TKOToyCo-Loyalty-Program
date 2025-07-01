-- Migration to convert tier system from spend-based to points-based
-- This migration renames minSpend/maxSpend to minPoints/maxPoints and updates values

-- First, add the new columns
ALTER TABLE "Tier" ADD COLUMN "minPoints" DOUBLE PRECISION;
ALTER TABLE "Tier" ADD COLUMN "maxPoints" DOUBLE PRECISION;

-- Copy data from old columns to new columns (1:1 conversion for now)
UPDATE "Tier" SET "minPoints" = "minSpend";
UPDATE "Tier" SET "maxPoints" = "maxSpend";

-- Update the tier thresholds to match the correct point values from the UI
-- These values are based on the app.tiers.tsx file
UPDATE "Tier" SET "minPoints" = 0 WHERE "name" = 'Featherweight';
UPDATE "Tier" SET "minPoints" = 1500 WHERE "name" = 'Lightweight';
UPDATE "Tier" SET "minPoints" = 5000 WHERE "name" = 'Welterweight';
UPDATE "Tier" SET "minPoints" = 25000 WHERE "name" = 'Heavyweight';
UPDATE "Tier" SET "minPoints" = 9999999 WHERE "name" = 'Reigning Champion';

-- Set maxPoints for all tiers except the highest one
UPDATE "Tier" SET "maxPoints" = 1499 WHERE "name" = 'Featherweight';
UPDATE "Tier" SET "maxPoints" = 4999 WHERE "name" = 'Lightweight';
UPDATE "Tier" SET "maxPoints" = 24999 WHERE "name" = 'Welterweight';
UPDATE "Tier" SET "maxPoints" = 9999998 WHERE "name" = 'Heavyweight';
UPDATE "Tier" SET "maxPoints" = NULL WHERE "name" = 'Reigning Champion';

-- Make the new columns NOT NULL (except maxPoints which can be NULL)
ALTER TABLE "Tier" ALTER COLUMN "minPoints" SET NOT NULL;

-- Drop the old columns
ALTER TABLE "Tier" DROP COLUMN "minSpend";
ALTER TABLE "Tier" DROP COLUMN "maxSpend";
