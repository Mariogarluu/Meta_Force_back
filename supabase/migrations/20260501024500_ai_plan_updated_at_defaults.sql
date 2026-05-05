-- Asegura que los inserts de planes generados por IA no fallen por updatedAt.
ALTER TABLE public."Workout"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public."WorkoutExercise"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public."Diet"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public."DietMeal"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public."Exercise"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public."Meal"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
