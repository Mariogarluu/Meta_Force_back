-- Phase 2: transactional helpers callable from PostgREST rpc() (SECURITY INVOKER = RLS applies).

CREATE OR REPLACE FUNCTION public.rpc_duplicate_workout(p_workout_id text, p_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  orig public."Workout"%ROWTYPE;
  new_id text;
  new_name text;
  base_name text;
  suffix int := 1;
  ex_rec public."WorkoutExercise"%ROWTYPE;
BEGIN
  IF public.current_user_id_text() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO orig FROM public."Workout" WHERE id = p_workout_id AND "userId" = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrenamiento no encontrado';
  END IF;

  base_name := orig.name;
  new_name := base_name || ' (' || suffix::text || ')';
  WHILE EXISTS (SELECT 1 FROM public."Workout" w WHERE w."userId" = p_user_id AND w.name = new_name) LOOP
    suffix := suffix + 1;
    new_name := base_name || ' (' || suffix::text || ')';
  END LOOP;

  new_id := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public."Workout" (id, "userId", name, description, "createdAt", "updatedAt")
  VALUES (new_id, p_user_id, new_name, orig.description, now(), now());

  FOR ex_rec IN
    SELECT * FROM public."WorkoutExercise" WHERE "workoutId" = p_workout_id
  LOOP
    INSERT INTO public."WorkoutExercise" (
      id, "workoutId", "exerciseId", "dayOfWeek", "order",
      sets, reps, weight, duration, "restSeconds", notes, "createdAt", "updatedAt"
    )
    VALUES (
      replace(gen_random_uuid()::text, '-', ''),
      new_id,
      ex_rec."exerciseId",
      ex_rec."dayOfWeek",
      ex_rec."order",
      ex_rec.sets,
      ex_rec.reps,
      ex_rec.weight,
      ex_rec.duration,
      ex_rec."restSeconds",
      ex_rec.notes,
      now(),
      now()
    );
  END LOOP;

  RETURN (SELECT row_to_json(w.*) FROM public."Workout" w WHERE w.id = new_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_reorder_diet_meals(p_diet_id text, p_meals jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  d_owner text;
  elem jsonb;
BEGIN
  SELECT "userId" INTO d_owner FROM public."Diet" WHERE id = p_diet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dieta no encontrada';
  END IF;
  IF public.current_user_id_text() IS DISTINCT FROM d_owner THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(p_meals)
  LOOP
    UPDATE public."DietMeal"
    SET
      "dayOfWeek" = (elem->>'dayOfWeek')::int,
      "mealType" = lower(elem->>'mealType'),
      "order" = (elem->>'order')::int,
      "updatedAt" = now()
    WHERE id = (elem->>'id')::text AND "dietId" = p_diet_id;
  END LOOP;

  RETURN json_build_object('ok', true, 'dietId', p_diet_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_duplicate_workout(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_reorder_diet_meals(text, jsonb) TO authenticated;
