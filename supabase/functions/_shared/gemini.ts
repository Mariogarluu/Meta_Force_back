/**
 * =============================================================================
 * UTILIDADES DE INTELIGENCIA ARTIFICIAL (GEMINI UTILS)
 * =============================================================================
 * Este módulo gestiona la comunicación directa con la API de Google Gemini.
 * Se utiliza para la generación de contenido dinámico, planes de entrenamiento
 * y chat interactivo utilizando modelos generativos.
 */
const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Realiza una llamada a la API de Gemini para generar contenido.
 * 
 * @param systemInstruction - Instrucciones de contexto y rol para la IA.
 * @param prompt - El mensaje o pregunta específica del usuario.
 * @returns La respuesta textual generada por el modelo.
 * @throws Error si la API Key no está configurada o si hay fallos de red.
 */
export async function callGemini(
  systemInstruction: string,
  prompt: string,
): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }
  const model = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${
      encodeURIComponent(apiKey)
    }`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", res.status, errText);
    throw new Error(`Error de comunicación con la IA. Details: ${res.status} - ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Respuesta vacía de la IA.");
  }
  return text;
}
