-- CreateTable
CREATE TABLE "ClassTrainer" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTrainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassCenterSchedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCenterSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassTrainer_classId_idx" ON "ClassTrainer"("classId");

-- CreateIndex
CREATE INDEX "ClassTrainer_trainerId_idx" ON "ClassTrainer"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTrainer_classId_trainerId_key" ON "ClassTrainer"("classId", "trainerId");

-- CreateIndex
CREATE INDEX "ClassCenterSchedule_classId_idx" ON "ClassCenterSchedule"("classId");

-- CreateIndex
CREATE INDEX "ClassCenterSchedule_centerId_idx" ON "ClassCenterSchedule"("centerId");

-- CreateIndex
CREATE INDEX "ClassCenterSchedule_classId_centerId_idx" ON "ClassCenterSchedule"("classId", "centerId");

-- AddForeignKey
ALTER TABLE "ClassTrainer" ADD CONSTRAINT "ClassTrainer_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GymClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTrainer" ADD CONSTRAINT "ClassTrainer_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCenterSchedule" ADD CONSTRAINT "ClassCenterSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GymClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCenterSchedule" ADD CONSTRAINT "ClassCenterSchedule_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
