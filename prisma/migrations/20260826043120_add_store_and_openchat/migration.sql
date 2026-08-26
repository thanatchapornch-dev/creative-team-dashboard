-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL DEFAULT '',
    "storeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "subdistrict" TEXT NOT NULL DEFAULT '',
    "district" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "googleMapsUrl" TEXT NOT NULL DEFAULT '',
    "warehouse" TEXT NOT NULL DEFAULT '',
    "buddhistRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "muslimRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "burmeseRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cambodianRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zoning" TEXT NOT NULL DEFAULT '',
    "grandOpening" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenChatCount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpenChatCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeCode_key" ON "Store"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "OpenChatCount_storeId_weekOf_key" ON "OpenChatCount"("storeId", "weekOf");

-- AddForeignKey
ALTER TABLE "OpenChatCount" ADD CONSTRAINT "OpenChatCount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenChatCount" ADD CONSTRAINT "OpenChatCount_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
