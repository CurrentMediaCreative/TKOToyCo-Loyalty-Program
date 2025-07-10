-- CreateTable
CREATE TABLE "EventOrderProcessing" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "orderTotal" DECIMAL(10,2) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "bonusPointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOrderProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventOrderProcessing_eventId_orderId_key" ON "EventOrderProcessing"("eventId", "orderId");

-- AddForeignKey
ALTER TABLE "EventOrderProcessing" ADD CONSTRAINT "EventOrderProcessing_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PointEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
