-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "loyalty_points_attribution_rate" DECIMAL(5,4),
    "loyalty_points_conversion_rate" DECIMAL(10,2),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_id_key" ON "system_settings"("id");

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing loyalty points settings from settings table to system_settings
-- Create a single row with migrated data
INSERT INTO "system_settings" ("id", "loyalty_points_attribution_rate", "loyalty_points_conversion_rate", "updated_at", "created_at")
SELECT 
    gen_random_uuid()::text,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'loyalty_points_attribution_rate')
        THEN CAST((SELECT "value" FROM "settings" WHERE "key" = 'loyalty_points_attribution_rate') AS DECIMAL(5,4))
        ELSE 0.01
    END,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "settings" WHERE "key" = 'loyalty_points_conversion_rate')
        THEN CAST((SELECT "value" FROM "settings" WHERE "key" = 'loyalty_points_conversion_rate') AS DECIMAL(10,2))
        ELSE 1.0
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "system_settings");

