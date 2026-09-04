-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_recipientId_fkey";

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "externalEmail" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "recipientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
