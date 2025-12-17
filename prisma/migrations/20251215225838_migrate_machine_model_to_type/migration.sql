-- Migración para cambiar MachineModel a MachineType y agregar instanceNumber
-- 1. Renombrar la tabla MachineModel a MachineType
ALTER TABLE "MachineModel" RENAME TO "MachineType";

-- 2. Renombrar la columna machineModelId a machineTypeId en Machine
ALTER TABLE "Machine" RENAME COLUMN "machineModelId" TO "machineTypeId";

-- 3. Agregar columna instanceNumber a Machine
-- Primero agregamos la columna como nullable temporalmente
ALTER TABLE "Machine" ADD COLUMN "instanceNumber" INTEGER;

-- 4. Asignar números de instancia basados en el orden por tipo y centro
-- Usamos ROW_NUMBER() para numerar las instancias
WITH numbered_machines AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY "machineTypeId", "centerId" ORDER BY "createdAt", id) AS instance_num
  FROM "Machine"
)
UPDATE "Machine"
SET "instanceNumber" = numbered_machines.instance_num
FROM numbered_machines
WHERE "Machine".id = numbered_machines.id;

-- 5. Hacer instanceNumber NOT NULL ahora que tiene valores
ALTER TABLE "Machine" ALTER COLUMN "instanceNumber" SET NOT NULL;

-- 6. Eliminar índices antiguos relacionados con machineModelId
DROP INDEX IF EXISTS "Machine_machineModelId_idx";
DROP INDEX IF EXISTS "Machine_machineModelId_centerId_idx";

-- 7. Renombrar el foreign key constraint
ALTER TABLE "Machine" 
  DROP CONSTRAINT IF EXISTS "Machine_machineModelId_fkey",
  ADD CONSTRAINT "Machine_machineTypeId_fkey" 
  FOREIGN KEY ("machineTypeId") REFERENCES "MachineType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Crear nuevos índices
CREATE INDEX IF NOT EXISTS "Machine_machineTypeId_idx" ON "Machine"("machineTypeId");
CREATE INDEX IF NOT EXISTS "Machine_centerId_idx" ON "Machine"("centerId");

-- 9. Crear constraint único para evitar duplicados
ALTER TABLE "Machine" 
  ADD CONSTRAINT "Machine_machineTypeId_centerId_instanceNumber_key" 
  UNIQUE ("machineTypeId", "centerId", "instanceNumber");

-- 10. Actualizar los nombres de las relaciones en los índices (si es necesario)
-- Nota: Los índices de Prisma se crean automáticamente, pero los mantenemos explícitos para claridad

