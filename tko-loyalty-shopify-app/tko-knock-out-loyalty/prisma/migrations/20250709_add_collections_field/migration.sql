-- Add collections field to PointEvent table
ALTER TABLE "PointEvent" ADD COLUMN "collections" TEXT;

-- Add channel field to PointEvent table for online/instore/both targeting
ALTER TABLE "PointEvent" ADD COLUMN "channel" TEXT DEFAULT 'both';
