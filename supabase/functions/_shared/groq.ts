const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function callGroq(
  systemInstruction: string,
  prompt: string,
): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  console.log("[groq] GROQ_API_KEY present:", Boolean(apiKey));
  if (!apiKey) {
    throw new Error("GROQ_API_KEY no está configurada.");
  }
  const model = Deno.env.get("GROQ_MODEL") ?? DEFAULT_MODEL;
  console.log(
    "[groq] model:",
    model,
    "system_chars:",
    systemInstruction.length,
    "prompt_chars:",
    prompt.length,
  );

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });
  } catch (e) {
    console.error("[groq] fetch failed:", e);
    throw new Error("Error de red al contactar con Groq.");
  }

  console.log("[groq] response status:", res.status);

  if (res.status === 429) {
    const errText = await res.text().catch(() => "");
    console.warn("[groq] 429 rate limit body:", errText.slice(0, 500));
    throw new Error("Límite de IA alcanzado por hoy. Inténtalo de nuevo mañana.");
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[groq] API error:", res.status, errText.slice(0, 1000));
    throw new Error(`Error de comunicación con la IA (${res.status}).`);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = await res.json();
  } catch (e) {
    console.error("[groq] JSON parse failed:", e);
    throw new Error("Respuesta inválida de la IA.");
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    console.error(
      "[groq] empty content. raw payload (truncated):",
      JSON.stringify(data).slice(0, 1000),
    );
    throw new Error("Respuesta vacía de la IA.");
  }
  console.log("[groq] response chars:", text.length);
  return text;
}
