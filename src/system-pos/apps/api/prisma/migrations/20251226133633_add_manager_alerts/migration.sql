-- CreateTable
CREATE TABLE "manager_alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "resource_id" TEXT,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "manager_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manager_alerts_warehouse_id_created_at_idx" ON "manager_alerts"("warehouse_id", "created_at");

-- CreateIndex
CREATE INDEX "manager_alerts_is_read_created_at_idx" ON "manager_alerts"("is_read", "created_at");

-- AddForeignKey
ALTER TABLE "manager_alerts" ADD CONSTRAINT "manager_alerts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

