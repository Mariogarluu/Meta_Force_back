import { createClient } from "npm:@supabase/supabase-js@2";
import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getProfileRole, getSupabaseAuthUser } from "../_shared/supabase-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const auth = await getSupabaseAuthUser(req);
  if (auth instanceof Response) return auth;

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const role = await getProfileRole(admin, auth.id);
  if (role !== "SUPERADMIN" && role !== "ADMIN_CENTER") {
    return jsonResponse({ message: "Sin permiso" }, 403);
  }

  let body: { kind?: string; items?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const kind = typeof body.kind === "string" ? body.kind : "";
  const items = Array.isArray(body.items) ? body.items : [];
  if (kind !== "exercises" && kind !== "meals") {
    return jsonResponse({ message: "kind debe ser exercises o meals" }, 400);
  }

  const results = { created: 0, skipped: 0, errors: [] as { name: string; error: string }[] };

  for (const raw of items) {
    const row = raw as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name) {
      results.skipped++;
      continue;
    }
    try {
      if (kind === "exercises") {
        const { data: existing } = await admin.from("Exercise").select("id").eq("name", name).maybeSingle();
        if (existing) {
          results.skipped++;
          continue;
        }
        const { error } = await admin.from("Exercise").insert({
          id: createId(),
          name,
          description: (row.description as string) ?? null,
          instructions: (row.instructions as string) ?? null,
          imageUrl: (row.imageUrl as string) ?? null,
          videoUrl: (row.videoUrl as string) ?? null,
          machineTypeId: (row.machineTypeId as string) ?? null,
        });
        if (error) throw new Error(error.message);
        results.created++;
      } else {
        const { data: existing } = await admin.from("Meal").select("id").eq("name", name).maybeSingle();
        if (existing) {
          results.skipped++;
          continue;
        }
        const { error } = await admin.from("Meal").insert({
          id: createId(),
          name,
          description: (row.description as string) ?? null,
          instructions: (row.instructions as string) ?? null,
          imageUrl: (row.imageUrl as string) ?? null,
          calories: (row.calories as number) ?? null,
          protein: (row.protein as number) ?? null,
          carbs: (row.carbs as number) ?? null,
          fats: (row.fats as number) ?? null,
          fiber: (row.fiber as number) ?? null,
        });
        if (error) throw new Error(error.message);
        results.created++;
      }
    } catch (e) {
      results.errors.push({
        name,
        error: e instanceof Error ? e.message : "Error",
      });
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
