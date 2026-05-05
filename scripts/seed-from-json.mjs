import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "supabase";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const rootDir = path.resolve(process.cwd(), "..");
  const exercisesPath = path.join(rootDir, "exercises_seed.json");
  const mealsPath = path.join(rootDir, "meals_seed.json");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Cargando seeds de ejercicios desde", exercisesPath);
  const exercisesJson = JSON.parse(await fs.readFile(exercisesPath, "utf8"));

  if (Array.isArray(exercisesJson) && exercisesJson.length > 0) {
    const { data, error } = await supabase
      .from("Exercise")
      .upsert(exercisesJson, { onConflict: "name" })
      .select("id");

    if (error) {
      console.error("Error insertando ejercicios:", error.message);
    } else {
      console.log(`Ejercicios procesados: ${data?.length ?? 0}`);
    }
  } else {
    console.warn("exercises_seed.json no contiene un array con elementos.");
  }

  console.log("Cargando seeds de comidas desde", mealsPath);
  const mealsJson = JSON.parse(await fs.readFile(mealsPath, "utf8"));

  if (Array.isArray(mealsJson) && mealsJson.length > 0) {
    const { data, error } = await supabase
      .from("Meal")
      .upsert(mealsJson, { onConflict: "name" })
      .select("id");

    if (error) {
      console.error("Error insertando comidas:", error.message);
    } else {
      console.log(`Comidas procesadas: ${data?.length ?? 0}`);
    }
  } else {
    console.warn("meals_seed.json no contiene un array con elementos.");
  }

  console.log("Seed completado.");
}

main().catch((err) => {
  console.error("Error general en seed-from-json:", err);
  process.exit(1);
});

