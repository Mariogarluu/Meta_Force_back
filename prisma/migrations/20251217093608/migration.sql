/*
  Warnings:

  - You are about to drop the column `description` on the `MachineType` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,type]` on the table `MachineType` will be added. If there are existing duplicate values, this will fail.
  - Made the column `machineTypeId` on table `Machine` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "MachineModel_type_idx";

-- AlterTable
ALTER TABLE "Machine"
    ADD COLUMN "maxUsers" INTEGER;

ALTER TABLE "Machine"
    ALTER COLUMN "machineTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MachineType"
    RENAME CONSTRAINT "MachineModel_pkey" TO "MachineType_pkey";

ALTER TABLE "MachineType"
    DROP COLUMN "description";

-- CreateIndex
CREATE UNIQUE INDEX "MachineType_name_type_key" ON "MachineType"("name", "type");
