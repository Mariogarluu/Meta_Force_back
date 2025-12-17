/*
  Warnings:

  - You are about to drop the column `name` on the `Machine` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Machine` table. All the data in the column will be lost.
  - Added the required column `machineModelId` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Eliminar columnas name y type si existen (pueden no existir si la tabla se creó después)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'Machine' AND column_name = 'name') THEN
    ALTER TABLE "Machine" DROP COLUMN "name";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'Machine' AND column_name = 'type') THEN
    ALTER TABLE "Machine" DROP COLUMN "type";
  END IF;
END $$;
-- Agregar machineModelId solo si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Machine' AND column_name = 'machineModelId') THEN
    ALTER TABLE "Machine" ADD COLUMN "machineModelId" TEXT;
    -- Hacer NOT NULL después de poblar datos si es necesario
    -- Por ahora lo dejamos nullable y se actualizará después
  END IF;
END $$;

-- CreateTable (solo si no existe)
CREATE TABLE IF NOT EXISTS "MachineModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (solo si no existe)
CREATE INDEX IF NOT EXISTS "MachineModel_type_idx" ON "MachineModel"("type");

-- CreateIndex (solo si no existen)
CREATE INDEX IF NOT EXISTS "Machine_machineModelId_idx" ON "Machine"("machineModelId");

-- CreateIndex (solo si no existe)
CREATE INDEX IF NOT EXISTS "Machine_centerId_idx" ON "Machine"("centerId");

-- CreateIndex (solo si no existe)
CREATE INDEX IF NOT EXISTS "Machine_machineModelId_centerId_idx" ON "Machine"("machineModelId", "centerId");

-- AddForeignKey (solo si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Machine_machineModelId_fkey' 
                 AND table_name = 'Machine') THEN
    ALTER TABLE "Machine" ADD CONSTRAINT "Machine_machineModelId_fkey" 
      FOREIGN KEY ("machineModelId") REFERENCES "MachineModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
