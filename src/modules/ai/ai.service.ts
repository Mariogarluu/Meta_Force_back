import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Estructura de respuesta para rutinas (mantener compatible)
interface AiWorkoutPlan {
    name: string;
    description: string;
    days: {
        dayOfWeek: number; // 0-6
        exercises: {
            exerciseName: string;
            matchId?: string;
            sets: number;
            reps: number;
            weight?: number;
            restSeconds?: number;
            notes?: string;
        }[];
    }[];
}

// Interfaz para respuestas de chat
interface ChatResponse {
    message: string;
    plan?: AiWorkoutPlan; // Opcional, si la IA decide generar un plan
}

/**
 * Llamada a la API de Gemini (Genérica)
 */
async function callGemini(systemInstruction: string, prompt: string): Promise<string> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY no está configurada.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (e) {
        logger.error('Error llamando a Gemini:', e);
        throw new Error('Error de comunicación con la IA.');
    }
}

/**
 * Genera una rutina (Legacy / Tool)
 * Reutilizamos la lógica anterior pero adaptada.
 */
export async function generateWorkoutPlan(userId: string, params: any) {
    // ... (mantener lógica anterior si se desea, o redirigir al chat)
    // Por simplicidad, mantendremos este método como "herramienta" que el chat podría invocar internamente
    // o el usuario directamente.
    // ... (Implementation remains similar but extracted for verify)
    return { name: "WIP", description: "Use chat instead", days: [] }; // Placeholder for now to focus on chat
}

/**
 * Chat principal con la IA
 */
export async function chatWithAi(userId: string, userMessage: string, sessionId?: string): Promise<{ sessionId: string, response: ChatResponse }> {

    // 1. Gestión de Sesión
    let session;
    if (sessionId) {
        session = await (prisma as any).aiChatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } } // Contexto limitado
        });
    }

    if (!session) {
        session = await (prisma as any).aiChatSession.create({
            data: { userId, title: 'Nuevo Chat' },
            include: { messages: true }
        });
    }

    // 2. Guardar mensaje del usuario
    await (prisma as any).aiChatMessage.create({
        data: {
            sessionId: session.id,
            role: 'user',
            content: userMessage
        }
    });

    // 3. Preparar contexto y prompt
    // Construimos el historial para enviarlo (o un resumen)
    // Gemini soporta chat history nativo, pero aquí haremos "stateless" por simplicidad enviando contexto concatenado
    // o usando el chatSession de Gemini si preferimos.
    // Para simplificar y asegurar control, usaremos "system instruction" + "last messages".

    const systemPrompt = `
        Eres "MetaForce Coach", un asistente experto EXCLUSIVAMENTE en gimnasio, fitness, nutrición y salud deportiva.
        Tu tono es motivador, profesional y directo.
        
        REGLAS CRÍTICAS:
        1. Si el usuario pregunta sobre CUALQUIER tema que no sea deporte, dieta o salud (ej: política, cine, matemáticas), DEBES rechazar responder educadamente. Ejemplo: "Soy un entrenador, solo puedo ayudarte con tus metas físicas."
        2. Puedes generar rutinas de ejercicios. Si el usuario pide una rutina, devuelve un JSON ESTRUCTURADO dentro de un bloque de código \`\`\`json ... \`\`\`.
        
        Estructura JSON para rutinas:
        {
            "plan": {
                "name": "Nombre",
                "description": "Desc",
                "days": [...]
            }
        }
    `;

    // Historial reciente para contexto
    const historyContext = session.messages.map((m: any) => `${m.role === 'user' ? 'Usuario' : 'Tu'}: ${m.content}`).join('\n');
    const fullPrompt = `${historyContext}\nUsuario: ${userMessage}\nTu respuesta:`;

    // 4. Llamar a la IA
    const aiRawResponse = await callGemini(systemPrompt as string, fullPrompt);

    // 5. Procesar respuesta (detectar si hay JSON de rutina)
    let finalMessage = aiRawResponse;
    let generatedPlan: AiWorkoutPlan | undefined;

    // Intentar extraer JSON si existe
    const jsonMatch: RegExpMatchArray | null = aiRawResponse.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.plan) {
                generatedPlan = parsed.plan;
                // Limpiamos el JSON del texto visible para que no se vea "feo" en el chat
                // Opcional: dejarlo o quitarlo. Lo quitaremos y enviaremos el objeto estructurado.
                finalMessage = aiRawResponse.replace(/```json[\s\S]*?```/, '(Ver rutina generada abajo)').trim();
            }
        } catch (e) {
            logger.warn('Fallo al parsear JSON de rutina en chat');
        }
    }

    // 6. Guardar respuesta de la IA
    await (prisma as any).aiChatMessage.create({
        data: {
            sessionId: session.id,
            role: 'model',
            content: finalMessage
        }
    });

    const response: ChatResponse = {
        message: finalMessage
    };

    if (generatedPlan) {
        response.plan = generatedPlan;
    }

    return {
        sessionId: session.id,
        response
    };
}

/**
 * Obtener historial de sesiones
 */
export async function getUserSessions(userId: string) {
    return (prisma as any).aiChatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
}
