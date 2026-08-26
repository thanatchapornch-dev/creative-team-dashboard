-- DropIndex
DROP INDEX "Store_storeCode_key";

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "storeCode" SET DEFAULT '';
