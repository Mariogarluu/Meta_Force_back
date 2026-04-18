-- Supabase-native RLS policies
-- Focus: user-owned tables should be accessible only by their owner (auth.uid()).

-- Ensure RLS enabled (idempotent)
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Workout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkoutExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Diet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DietMeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExerciseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserMeasurement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BodyWeightRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExerciseRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiChatMessage" ENABLE ROW LEVEL SECURITY;

-- Helper: treat text userId as uuid text (we store auth.users.id as text in existing tables)
CREATE OR REPLACE FUNCTION public.current_user_id_text()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text;
$$;

-- Notification
DROP POLICY IF EXISTS "Notification: select own" ON public."Notification";
CREATE POLICY "Notification: select own"
ON public."Notification" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Notification: insert own" ON public."Notification";
CREATE POLICY "Notification: insert own"
ON public."Notification" FOR INSERT
WITH CHECK (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Notification: update own" ON public."Notification";
CREATE POLICY "Notification: update own"
ON public."Notification" FOR UPDATE
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Notification: delete own" ON public."Notification";
CREATE POLICY "Notification: delete own"
ON public."Notification" FOR DELETE
USING (public.current_user_id_text() = "userId");

-- Workout
DROP POLICY IF EXISTS "Workout: select own" ON public."Workout";
CREATE POLICY "Workout: select own"
ON public."Workout" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Workout: insert own" ON public."Workout";
CREATE POLICY "Workout: insert own"
ON public."Workout" FOR INSERT
WITH CHECK (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Workout: update own" ON public."Workout";
CREATE POLICY "Workout: update own"
ON public."Workout" FOR UPDATE
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Workout: delete own" ON public."Workout";
CREATE POLICY "Workout: delete own"
ON public."Workout" FOR DELETE
USING (public.current_user_id_text() = "userId");

-- WorkoutExercise (owner via parent workout)
DROP POLICY IF EXISTS "WorkoutExercise: select own" ON public."WorkoutExercise";
CREATE POLICY "WorkoutExercise: select own"
ON public."WorkoutExercise" FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."Workout" w
    WHERE w.id = "workoutId"
      AND w."userId" = public.current_user_id_text()
  )
);

DROP POLICY IF EXISTS "WorkoutExercise: write own" ON public."WorkoutExercise";
CREATE POLICY "WorkoutExercise: write own"
ON public."WorkoutExercise" FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public."Workout" w
    WHERE w.id = "workoutId"
      AND w."userId" = public.current_user_id_text()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Workout" w
    WHERE w.id = "workoutId"
      AND w."userId" = public.current_user_id_text()
  )
);

-- Diet
DROP POLICY IF EXISTS "Diet: select own" ON public."Diet";
CREATE POLICY "Diet: select own"
ON public."Diet" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "Diet: write own" ON public."Diet";
CREATE POLICY "Diet: write own"
ON public."Diet" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- DietMeal (owner via parent diet)
DROP POLICY IF EXISTS "DietMeal: select own" ON public."DietMeal";
CREATE POLICY "DietMeal: select own"
ON public."DietMeal" FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."Diet" d
    WHERE d.id = "dietId"
      AND d."userId" = public.current_user_id_text()
  )
);

DROP POLICY IF EXISTS "DietMeal: write own" ON public."DietMeal";
CREATE POLICY "DietMeal: write own"
ON public."DietMeal" FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public."Diet" d
    WHERE d.id = "dietId"
      AND d."userId" = public.current_user_id_text()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."Diet" d
    WHERE d.id = "dietId"
      AND d."userId" = public.current_user_id_text()
  )
);

-- ExerciseLog
DROP POLICY IF EXISTS "ExerciseLog: select own" ON public."ExerciseLog";
CREATE POLICY "ExerciseLog: select own"
ON public."ExerciseLog" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "ExerciseLog: write own" ON public."ExerciseLog";
CREATE POLICY "ExerciseLog: write own"
ON public."ExerciseLog" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- UserMeasurement
DROP POLICY IF EXISTS "UserMeasurement: select own" ON public."UserMeasurement";
CREATE POLICY "UserMeasurement: select own"
ON public."UserMeasurement" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "UserMeasurement: write own" ON public."UserMeasurement";
CREATE POLICY "UserMeasurement: write own"
ON public."UserMeasurement" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- BodyWeightRecord
DROP POLICY IF EXISTS "BodyWeightRecord: select own" ON public."BodyWeightRecord";
CREATE POLICY "BodyWeightRecord: select own"
ON public."BodyWeightRecord" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "BodyWeightRecord: write own" ON public."BodyWeightRecord";
CREATE POLICY "BodyWeightRecord: write own"
ON public."BodyWeightRecord" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- ExerciseRecord
DROP POLICY IF EXISTS "ExerciseRecord: select own" ON public."ExerciseRecord";
CREATE POLICY "ExerciseRecord: select own"
ON public."ExerciseRecord" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "ExerciseRecord: write own" ON public."ExerciseRecord";
CREATE POLICY "ExerciseRecord: write own"
ON public."ExerciseRecord" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- AiChatSession
DROP POLICY IF EXISTS "AiChatSession: select own" ON public."AiChatSession";
CREATE POLICY "AiChatSession: select own"
ON public."AiChatSession" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "AiChatSession: write own" ON public."AiChatSession";
CREATE POLICY "AiChatSession: write own"
ON public."AiChatSession" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

-- AiChatMessage (owner via session)
DROP POLICY IF EXISTS "AiChatMessage: select own" ON public."AiChatMessage";
CREATE POLICY "AiChatMessage: select own"
ON public."AiChatMessage" FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."AiChatSession" s
    WHERE s.id = "sessionId"
      AND s."userId" = public.current_user_id_text()
  )
);

DROP POLICY IF EXISTS "AiChatMessage: write own" ON public."AiChatMessage";
CREATE POLICY "AiChatMessage: write own"
ON public."AiChatMessage" FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public."AiChatSession" s
    WHERE s.id = "sessionId"
      AND s."userId" = public.current_user_id_text()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."AiChatSession" s
    WHERE s.id = "sessionId"
      AND s."userId" = public.current_user_id_text()
  )
);

