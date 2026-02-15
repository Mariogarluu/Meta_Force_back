-- CreateTable: Exercise (Banco de ejercicios)
CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "machineTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Workout (Entrenamientos de usuarios)
CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkoutExercise (Ejercicios en entrenamientos)
CREATE TABLE IF NOT EXISTS "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "weight" DOUBLE PRECISION,
    "duration" INTEGER,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Meal (Banco de comidas)
CREATE TABLE IF NOT EXISTS "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "imageUrl" TEXT,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fats" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Diet (Dietas de usuarios)
CREATE TABLE IF NOT EXISTS "Diet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diet_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DietMeal (Comidas en dietas)
CREATE TABLE IF NOT EXISTS "DietMeal" (
    "id" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Exercise_machineTypeId_idx" ON "Exercise"("machineTypeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Workout_userId_idx" ON "Workout"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");
CREATE INDEX IF NOT EXISTS "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");
CREATE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_dayOfWeek_idx" ON "WorkoutExercise"("workoutId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Meal_name_key" ON "Meal"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Diet_userId_idx" ON "Diet"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DietMeal_dietId_idx" ON "DietMeal"("dietId");
CREATE INDEX IF NOT EXISTS "DietMeal_mealId_idx" ON "DietMeal"("mealId");
CREATE INDEX IF NOT EXISTS "DietMeal_dietId_dayOfWeek_idx" ON "DietMeal"("dietId", "dayOfWeek");

-- AddForeignKey Exercise_machineTypeId: NO añadir aquí. MachineType se crea en 20251215.
-- La FK se añade en 20251229193216_add_workouts_and_diets cuando MachineType ya existe.

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Workout_userId_fkey' 
                 AND table_name = 'Workout') THEN
    ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'WorkoutExercise_workoutId_fkey' 
                 AND table_name = 'WorkoutExercise') THEN
    ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" 
      FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'WorkoutExercise_exerciseId_fkey' 
                 AND table_name = 'WorkoutExercise') THEN
    ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" 
      FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'Diet_userId_fkey' 
                 AND table_name = 'Diet') THEN
    ALTER TABLE "Diet" ADD CONSTRAINT "Diet_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'DietMeal_dietId_fkey' 
                 AND table_name = 'DietMeal') THEN
    ALTER TABLE "DietMeal" ADD CONSTRAINT "DietMeal_dietId_fkey" 
      FOREIGN KEY ("dietId") REFERENCES "Diet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'DietMeal_mealId_fkey' 
                 AND table_name = 'DietMeal') THEN
    ALTER TABLE "DietMeal" ADD CONSTRAINT "DietMeal_mealId_fkey" 
      FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

