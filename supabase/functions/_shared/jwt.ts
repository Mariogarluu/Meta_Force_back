import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";
import { corsHeaders } from "./cors.ts";

const ROLES = new Set([
  "SUPERADMIN",
  "ADMIN_CENTER",
  "TRAINER",
  "CLEANER",
  "USER",
]);

export type MetaForceJwt = {
  sub: string;
  email: string;
  role: string;
  centerId?: string | null;
};

export async function verifyMetaForceJwt(
  req: Request,
): Promise<MetaForceJwt | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "No autorizado: Se requiere una sesión activa",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  const token = auth.slice(7);
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret || secret.length < 32) {
    return new Response(JSON.stringify({ message: "Servidor mal configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = typeof payload.role === "string" ? payload.role : "";
    if (!sub || !email || !ROLES.has(role)) {
      return new Response(JSON.stringify({ message: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const centerId =
      "centerId" in payload && payload.centerId != null
        ? String(payload.centerId)
        : null;
    return { sub, email, role, centerId };
  } catch {
    return new Response(JSON.stringify({ message: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
