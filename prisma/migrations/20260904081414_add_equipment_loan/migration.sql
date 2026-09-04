-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentLoan" (
    "id" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "otherNote" TEXT NOT NULL DEFAULT '',
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentLoanItem" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,

    CONSTRAINT "EquipmentLoanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentLoanItem_loanId_equipmentItemId_key" ON "EquipmentLoanItem"("loanId", "equipmentItemId");

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLoanItem" ADD CONSTRAINT "EquipmentLoanItem_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "EquipmentLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLoanItem" ADD CONSTRAINT "EquipmentLoanItem_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
