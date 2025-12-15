/*
  Warnings:

  - You are about to drop the column `name` on the `Machine` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Machine` table. All the data in the column will be lost.
  - Added the required column `machineModelId` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Machine" DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "machineModelId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MachineModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineModel_type_idx" ON "MachineModel"("type");

-- CreateIndex
CREATE INDEX "Machine_machineModelId_idx" ON "Machine"("machineModelId");

-- CreateIndex
CREATE INDEX "Machine_centerId_idx" ON "Machine"("centerId");

-- CreateIndex
CREATE INDEX "Machine_machineModelId_centerId_idx" ON "Machine"("machineModelId", "centerId");

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_machineModelId_fkey" FOREIGN KEY ("machineModelId") REFERENCES "MachineModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
