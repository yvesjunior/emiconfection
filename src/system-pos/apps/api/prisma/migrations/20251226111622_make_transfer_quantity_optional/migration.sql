-- AlterTable: Make quantity optional in stock_transfer_requests
ALTER TABLE "stock_transfer_requests" ALTER COLUMN "quantity" DROP NOT NULL;
