-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('BOUTIQUE', 'STOCKAGE');

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN "type" "WarehouseType" NOT NULL DEFAULT 'BOUTIQUE';

