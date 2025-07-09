-- Add tags field to PointEvent table
ALTER TABLE "PointEvent" ADD COLUMN "tags" TEXT;

-- Update eventType comment to reflect new options
COMMENT ON COLUMN "PointEvent"."eventType" IS 'category or product-specific';
