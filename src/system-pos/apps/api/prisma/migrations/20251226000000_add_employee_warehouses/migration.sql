-- CreateTable: employee_warehouses
-- This migration adds support for multiple warehouse assignments per employee
-- while maintaining backward compatibility with the single warehouseId field

CREATE TABLE IF NOT EXISTS "employee_warehouses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employee_warehouses_employee_id_warehouse_id_key" ON "employee_warehouses"("employee_id", "warehouse_id");

-- AddForeignKey
ALTER TABLE "employee_warehouses" ADD CONSTRAINT "employee_warehouses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_warehouses" ADD CONSTRAINT "employee_warehouses_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Create employee_warehouses entries from existing warehouseId
-- This ensures backward compatibility - existing single warehouse assignments are preserved
INSERT INTO "employee_warehouses" ("id", "employee_id", "warehouse_id", "created_at")
SELECT 
    gen_random_uuid()::text as id,
    "id" as employee_id,
    "warehouse_id" as warehouse_id,
    CURRENT_TIMESTAMP as created_at
FROM "employees"
WHERE "warehouse_id" IS NOT NULL
ON CONFLICT ("employee_id", "warehouse_id") DO NOTHING;

