-- Add store credit tracking fields to Order and Customer models
-- Migration: 20250801_add_store_credit_tracking

-- Add store credit tracking to Order table
ALTER TABLE "Order" ADD COLUMN "storeCreditUsed" DECIMAL(10,2) DEFAULT 0.00;

-- Add store credit summary fields to Customer table  
ALTER TABLE "Customer" ADD COLUMN "totalStoreCreditUsed" DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE "Customer" ADD COLUMN "loyaltyEligibleSpend" DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for performance
CREATE INDEX "Order_storeCreditUsed_idx" ON "Order"("storeCreditUsed");
CREATE INDEX "Customer_totalStoreCreditUsed_idx" ON "Customer"("totalStoreCreditUsed");
CREATE INDEX "Customer_loyaltyEligibleSpend_idx" ON "Customer"("loyaltyEligibleSpend");
