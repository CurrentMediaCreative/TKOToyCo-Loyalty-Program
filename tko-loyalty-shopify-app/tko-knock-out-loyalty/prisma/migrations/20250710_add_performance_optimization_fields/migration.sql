-- Migration: Add performance optimization fields
-- This migration adds fields to support local caching and performance optimization

-- Add new fields to Customer table
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "numberOfOrders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Customer_lastSyncAt_idx" ON "Customer"("lastSyncAt");
CREATE INDEX IF NOT EXISTS "Customer_isActive_idx" ON "Customer"("isActive");
CREATE INDEX IF NOT EXISTS "Customer_numberOfOrders_idx" ON "Customer"("numberOfOrders");

-- Create DashboardMetrics table
CREATE TABLE IF NOT EXISTS "DashboardMetrics" (
    "id" TEXT NOT NULL DEFAULT 'dashboard',
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yearSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tierCounts" TEXT NOT NULL DEFAULT '{}',
    "topCompetitorsToday" TEXT NOT NULL DEFAULT '[]',
    "topCompetitorsMonth" TEXT NOT NULL DEFAULT '[]',
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardMetrics_pkey" PRIMARY KEY ("id")
);

-- Insert initial dashboard metrics row
INSERT INTO "DashboardMetrics" ("id") VALUES ('dashboard') ON CONFLICT ("id") DO NOTHING;
