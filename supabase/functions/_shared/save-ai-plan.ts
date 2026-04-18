import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AiGeneratedPlan = {
  type: "WORKOUT" | "DIET";
  name: string;
  description: string;
  days: Array<{
    dayOfWeek?: number;
    items?: Array<{
      name: string;
      sets?: number;
      reps?: number;
      quantity?: string;
      notes?: string;
    }>;
    exercises?: unknown[];
    meals?: unknown[];
  }>;
};

async function findExerciseIdCi(
  sb: SupabaseClient,
  name: string,
): Promise<string | undefined> {
  const { data, error } = await sb.from("Exercise").select("id, name");
  if (error || !data) return undefined;
  const n = name.trim().toLowerCase();
  const row = data.find((r) => (r as { name: string }).name.toLowerCase() === n);
  return (row as { id: string } | undefined)?.id;
}

async function getOrCreateExerciseId(
  sb: SupabaseClient,
  name: string,
): Promise<string | null> {
  const itemName = name.trim();
  if (!itemName) return null;
  let id = await findExerciseIdCi(sb, itemName);
  if (id) return id;
  const newId = createId();
  const { error } = await sb.from("Exercise").insert({
    id: newId,
    name: itemName,
    description: "Generado por AI",
  });
  if (error) {
    id = await findExerciseIdCi(sb, itemName);
    return id ?? null;
  }
  return newId;
}

async function findMealIdCi(
  sb: SupabaseClient,
  name: string,
): Promise<string | undefined> {
  const { data, error } = await sb.from("Meal").select("id, name");
  if (error || !data) return undefined;
  const n = name.trim().toLowerCase();
  const row = data.find((r) => (r as { name: string }).name.toLowerCase() === n);
  return (row as { id: string } | undefined)?.id;
}

async function getOrCreateMealId(
  sb: SupabaseClient,
  name: string,
): Promise<string | null> {
  const itemName = name.trim();
  if (!itemName) return null;
  let id = await findMealIdCi(sb, itemName);
  if (id) return id;
  const newId = createId();
  const { error } = await sb.from("Meal").insert({
    id: newId,
    name: itemName,
    description: "Generada por AI",
  });
  if (error) {
    if (String(error.message || "").includes("duplicate") || error.code === "23505") {
      id = await findMealIdCi(sb, itemName);
      return id ?? null;
    }
    return null;
  }
  return newId;
}

async function deleteWorkoutCascade(sb: SupabaseClient, workoutId: string) {
  await sb.from("WorkoutExercise").delete().eq("workoutId", workoutId);
  await sb.from("Workout").delete().eq("id", workoutId);
}

async function deleteDietCascade(sb: SupabaseClient, dietId: string) {
  await sb.from("DietMeal").delete().eq("dietId", dietId);
  await sb.from("Diet").delete().eq("id", dietId);
}

export async function saveAiPlan(
  sb: SupabaseClient,
  userId: string,
  plan: AiGeneratedPlan,
): Promise<unknown> {
  if (plan.type === "WORKOUT") {
    const dbExercises: Record<string, string> = {};
    const safeDays = Array.isArray(plan.days) ? plan.days : [];
    for (const day of safeDays) {
      const items = (day?.items ?? day?.exercises ?? day?.meals ?? []) as Array<
        { name?: string }
      >;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item?.name) continue;
        const itemName = String(item.name).trim();
        if (dbExercises[itemName]) continue;
        const exId = await getOrCreateExerciseId(sb, itemName);
        if (exId) dbExercises[itemName] = exId;
      }
    }

    const workoutId = createId();
    const { error: wErr } = await sb.from("Workout").insert({
      id: workoutId,
      userId,
      name: plan.name || "Rutina de Entrenamiento",
      description: plan.description || "Generado por IA",
    });
    if (wErr) throw new Error(wErr.message);

    try {
      for (let d = 0; d < safeDays.length; d++) {
        const day = safeDays[d];
        if (!day) continue;
        const items = (day.items ?? day.exercises ?? day.meals ?? []) as Array<{
          name?: string;
          sets?: number;
          reps?: number;
          notes?: string;
        }>;
        if (!Array.isArray(items)) continue;
        const dayOfWeekValue = typeof day.dayOfWeek === "number"
          ? (day.dayOfWeek - 1)
          : d;
        const finalDayOfWeek = Math.max(0, Math.min(6, dayOfWeekValue));

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item?.name) continue;
          const itemName = String(item.name).trim();
          const exerciseId = dbExercises[itemName];
          if (!exerciseId) continue;

          const { error: weErr } = await sb.from("WorkoutExercise").insert({
            id: createId(),
            workoutId,
            exerciseId,
            dayOfWeek: finalDayOfWeek,
            order: i,
            sets: Number(item.sets) || 3,
            reps: Number(item.reps) || 10,
            notes: item.notes ?? null,
          });
          if (weErr) throw new Error(weErr.message);
        }
      }
    } catch (e) {
      await deleteWorkoutCascade(sb, workoutId);
      throw e;
    }

    const { data: workout } = await sb.from("Workout").select("*").eq(
      "id",
      workoutId,
    ).single();
    return workout;
  }

  if (plan.type === "DIET") {
    const dbMeals: Record<string, string> = {};
    const safeDays = Array.isArray(plan.days) ? plan.days : [];
    for (const day of safeDays) {
      const items = (day?.items ?? day?.exercises ?? day?.meals ?? []) as Array<
        { name?: string }
      >;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item?.name) continue;
        const itemName = String(item.name).trim();
        if (dbMeals[itemName]) continue;
        const mId = await getOrCreateMealId(sb, itemName);
        if (mId) dbMeals[itemName] = mId;
      }
    }

    const dietId = createId();
    const { error: dErr } = await sb.from("Diet").insert({
      id: dietId,
      userId,
      name: plan.name || "Plan de Nutrición",
      description: plan.description || "Generado por IA",
    });
    if (dErr) throw new Error(dErr.message);

    try {
      for (let d = 0; d < safeDays.length; d++) {
        const day = safeDays[d];
        if (!day) continue;
        const items = (day.items ?? day.exercises ?? day.meals ?? []) as Array<{
          name?: string;
          quantity?: string;
          notes?: string;
        }>;
        if (!Array.isArray(items)) continue;
        const dayOfWeekValue = typeof day.dayOfWeek === "number"
          ? (day.dayOfWeek - 1)
          : d;
        const finalDayOfWeek = Math.max(0, Math.min(6, dayOfWeekValue));

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item?.name) continue;
          const itemName = String(item.name).trim();
          const mealId = dbMeals[itemName];
          if (!mealId) continue;

          const typeLower = itemName.toLowerCase();
          let mealType = "almuerzo";
          if (typeLower.includes("desayuno") || typeLower.includes("breakfast")) {
            mealType = "desayuno";
          } else if (typeLower.includes("cena") || typeLower.includes("dinner")) {
            mealType = "cena";
          } else if (typeLower.includes("merienda") || typeLower.includes("snack")) {
            mealType = "merienda";
          }

          const notesVal = item.quantity
            ? `${item.quantity}. ${item.notes || ""}`
            : (item.notes || null);

          const { error: dmErr } = await sb.from("DietMeal").insert({
            id: createId(),
            dietId,
            mealId,
            dayOfWeek: finalDayOfWeek,
            mealType,
            order: i,
            notes: notesVal,
          });
          if (dmErr) throw new Error(dmErr.message);
        }
      }
    } catch (e) {
      await deleteDietCascade(sb, dietId);
      throw e;
    }

    const { data: diet } = await sb.from("Diet").select("*").eq("id", dietId).single();
    return diet;
  }

  throw new Error("Tipo de plan no soportado (debe ser WORKOUT o DIET)");
}
