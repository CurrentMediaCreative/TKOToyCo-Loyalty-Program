-- Migration to support multiple emails per customer
-- This will replace the single email field with an emails array

-- Step 1: Add the new emails array column
ALTER TABLE "Customer" ADD COLUMN "emails" TEXT[];

-- Step 2: Migrate existing email data to the new emails array
UPDATE "Customer" 
SET "emails" = CASE 
  WHEN "email" IS NOT NULL AND "email" != '' THEN ARRAY["email"]
  ELSE ARRAY[]::TEXT[]
END;

-- Step 3: Create index on emails array for efficient searching
CREATE INDEX "Customer_emails_idx" ON "Customer" USING GIN ("emails");

-- Step 4: Drop the old email column (we'll do this after data migration is complete)
-- ALTER TABLE "Customer" DROP COLUMN "email";

-- Note: We're keeping the email column for now to ensure data safety
-- The migration script will handle the final cleanup
