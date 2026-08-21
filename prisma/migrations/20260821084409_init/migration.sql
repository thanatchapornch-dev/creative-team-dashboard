-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'LEADER', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusToday" AS ENUM ('AVAILABLE', 'BUSY', 'WORKING', 'LEAVE', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING', 'REVIEW', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'BUSINESS', 'SICK', 'OTHER', 'URGENT');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OvertimeCategory" AS ENUM ('CAMPAIGN_DEADLINE', 'EVENT', 'OPENING', 'URGENT_REQUEST', 'PRODUCTION', 'EDITING', 'SHOOT', 'OTHER');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'QUEUED', 'FAILED', 'SKIPPED_NO_PROVIDER');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "workEmail" TEXT NOT NULL DEFAULT '',
    "profilePictureUrl" TEXT NOT NULL DEFAULT '',
    "pinHash" TEXT NOT NULL,
    "statusToday" "StatusToday" NOT NULL DEFAULT 'AVAILABLE',
    "dailyCapacityHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "backupId" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "brief" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "notes" TEXT NOT NULL DEFAULT '',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "leaveDays" DOUBLE PRECISION NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "approvalDeadline" TIMESTAMP(3) NOT NULL,
    "advanceNoticeDays" INTEGER NOT NULL,
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "project" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "category" "OvertimeCategory" NOT NULL DEFAULT 'OTHER',
    "reason" TEXT NOT NULL DEFAULT '',
    "approvedById" TEXT,
    "status" "OvertimeStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relatedType" TEXT NOT NULL DEFAULT '',
    "relatedId" TEXT NOT NULL DEFAULT '',
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL DEFAULT 'Creative & Production',
    "workingDays" TEXT NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI',
    "holidays" TEXT NOT NULL DEFAULT '[]',
    "annualLeaveNoticeDays" INTEGER NOT NULL DEFAULT 7,
    "approvalSlaDays" INTEGER NOT NULL DEFAULT 3,
    "taskReminderDaysBefore" INTEGER NOT NULL DEFAULT 2,
    "themeColors" TEXT NOT NULL DEFAULT '{"navy":"#0F1B33","offwhite":"#F7F5F0","orange":"#FF7A33","lime":"#B6E64B"}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_nickname_key" ON "Member"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskCode_key" ON "Task"("taskCode");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeEntry" ADD CONSTRAINT "OvertimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeEntry" ADD CONSTRAINT "OvertimeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
