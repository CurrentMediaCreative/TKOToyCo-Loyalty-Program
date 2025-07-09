-- CreateTable
CREATE TABLE "PendingOrder" (
    "id" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingOrder_shopifyOrderId_key" ON "PendingOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "PendingOrder_shopifyOrderId_idx" ON "PendingOrder"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "PendingOrder_customerId_idx" ON "PendingOrder"("customerId");

-- AddForeignKey
ALTER TABLE "PendingOrder" ADD CONSTRAINT "PendingOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
