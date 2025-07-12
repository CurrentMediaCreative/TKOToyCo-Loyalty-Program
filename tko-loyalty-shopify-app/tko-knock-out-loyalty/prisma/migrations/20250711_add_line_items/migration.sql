-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopifyId" BIGINT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sku" TEXT,
    "variantId" BIGINT,
    "productId" BIGINT,
    "variantTitle" TEXT,
    "vendor" TEXT,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "taxable" BOOLEAN DEFAULT true,
    "requiresShipping" BOOLEAN DEFAULT true,
    "fulfillmentService" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineItem_orderId_idx" ON "LineItem"("orderId");

-- CreateIndex
CREATE INDEX "LineItem_shopifyId_idx" ON "LineItem"("shopifyId");

-- CreateIndex
CREATE INDEX "LineItem_sku_idx" ON "LineItem"("sku");

-- CreateIndex
CREATE INDEX "LineItem_productId_idx" ON "LineItem"("productId");

-- CreateIndex
CREATE INDEX "LineItem_variantId_idx" ON "LineItem"("variantId");

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
