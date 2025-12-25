-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_transfer_requests" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "from_warehouse_id" TEXT NOT NULL,
    "to_warehouse_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "loyalty_points_used" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_product_id_idx" ON "stock_transfer_requests"("product_id");
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_from_warehouse_id_idx" ON "stock_transfer_requests"("from_warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_to_warehouse_id_idx" ON "stock_transfer_requests"("to_warehouse_id");
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_requested_by_idx" ON "stock_transfer_requests"("requested_by");
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_approved_by_idx" ON "stock_transfer_requests"("approved_by");
CREATE INDEX IF NOT EXISTS "stock_transfer_requests_status_idx" ON "stock_transfer_requests"("status");

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_requests" ADD CONSTRAINT "stock_transfer_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

