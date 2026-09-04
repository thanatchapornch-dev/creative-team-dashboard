-- DropForeignKey
ALTER TABLE "EquipmentLoan" DROP CONSTRAINT "EquipmentLoan_borrowerId_fkey";

-- AlterTable
ALTER TABLE "EquipmentLoan" ADD COLUMN     "externalContact" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "externalDept" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "externalEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "externalName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "borrowerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
