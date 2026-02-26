import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Estructura de respuesta combinada para rutinas o dietas
export interface AiGeneratedPlan {
    type: "WORKOUT" | "DIET";
    name: string;
    description: string;
    days: {
        dayOfWeek: number; // 0-6
        items?: {
            name: string;
            sets?: number;
            reps?: number;
            quantity?: string;
            notes?: string;
        }[];
        exercises?: any[]; // Fallback for AI hallucination
        meals?: any[]; // Fallback for AI hallucination
    }[];
}

// Interfaz para respuestas de chat
export interface ChatResponse {
    message: string;
    plan?: AiGeneratedPlan; // Opcional, si la IA decide generar un plan
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
        model: "gemini-2.5-flash",
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
        
        Estructura JSON:
        {
            "plan": {
                "type": "WORKOUT", // o "DIET"
                "name": "Nombre del Plan",
                "description": "Breve descripción",
                "days": [
                    {
                        "dayOfWeek": 1,
                        "items": [ // CRITICAL: MANTIENE ESTA CLAVE COMO "items". NUNCA uses "exercises" ni "meals".
                            {
                                "name": "Nombre Ejercicio o Comida",
                                "sets": 4, // Solo si es WORKOUT
                                "reps": 10, // Solo si es WORKOUT
                                "quantity": "1 porción", // Solo si es DIET
                                "notes": "Notas adicionales" 
                            }
                        ]
                    }
                ]
            }
        }
    `;

    // Historial reciente para contexto
    const historyContext = session.messages.map((m: any) => `${m.role === 'user' ? 'Usuario' : 'Tu'}: ${m.content}`).join('\n');
    const fullPrompt = `${historyContext}\nUsuario: ${userMessage}\nTu respuesta:`;

    // 4. Llamar a la IA
    const aiRawResponse = await callGemini(systemPrompt as string, fullPrompt);

    // 5. Procesar respuesta (detectar si hay JSON)
    let finalMessage = aiRawResponse;
    let generatedPlan: AiGeneratedPlan | undefined;

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
            }
        }
    });
}

/**
 * Elimina una sesión de chat y sus mensajes asociados
 */
export async function deleteSession(userId: string, sessionId: string) {
    // 1. Verificar que la sesión existe y pertenece al usuario
    const session = await (prisma as any).aiChatSession.findUnique({
        where: { id: sessionId }
    });

    if (!session) {
        throw new Error('Sesión no encontrada');
    }

    if (session.userId !== userId) {
        throw new Error('No tienes permiso para eliminar esta sesión');
    }

    // 2. Eliminar la sesión (los mensajes se eliminarán en cascada gracias a onDelete: Cascade en Prisma, 
    // o podemos borrarlos explícitamente si no está configurado). Prisma maneja Cascade si está en schema.
    await (prisma as any).aiChatSession.delete({
        where: { id: sessionId }
    });

    return { success: true, message: 'Sesión eliminada correctamente' };
}

/**
 * Guarda un plan generado por la IA en la base de datos (Workout o Diet)
 */
export async function saveAiPlan(userId: string, plan: AiGeneratedPlan) {
    if (plan.type === "WORKOUT") {
        // 1. Resolver ejercicios fuera de la transacción para evitar envenenarla con P2002
        let dbExercises: Record<string, string> = {};
        const safeDays = Array.isArray(plan.days) ? plan.days : [];
        for (const day of safeDays) {
            const items = day?.items || day?.exercises || day?.meals || [];
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (!item || !item.name) continue;
                const itemName = String(item.name).trim();
                if (dbExercises[itemName]) continue;

                let dbEx = await (prisma as any).exercise.findFirst({
                    where: { name: { equals: itemName, mode: 'insensitive' } }
                });
                if (!dbEx) {
                    try {
                        dbEx = await (prisma as any).exercise.create({
                            data: { name: itemName, description: 'Generado por AI' }
                        });
                    } catch (e: any) {
                        if (e.code === 'P2002') {
                            dbEx = await (prisma as any).exercise.findFirst({ where: { name: itemName } });
                        }
                    }
                }
                if (dbEx) dbExercises[itemName] = dbEx.id;
            }
        }

        // 2. Ejecutar transacción segura
        return prisma.$transaction(async (tx) => {
            const workout = await tx.workout.create({
                data: {
                    userId,
                    name: plan.name || 'Rutina de Entrenamiento',
                    description: plan.description || 'Generado por IA',
                }
            });

            for (let d = 0; d < safeDays.length; d++) {
                const day = safeDays[d];
                if (!day) continue;
                const items = day.items || day.exercises || day.meals || [];
                if (!Array.isArray(items)) continue;

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (!item || !item.name) continue;
                    const itemName = String(item.name).trim();
                    const exerciseId = dbExercises[itemName];
                    if (!exerciseId) continue;

                    await tx.workoutExercise.create({
                        data: {
                            workoutId: workout.id,
                            exerciseId: exerciseId,
                            dayOfWeek: typeof day?.dayOfWeek === 'number' ? day.dayOfWeek : (d + 1),
                            order: i,
                            sets: Number(item.sets) || 3,
                            reps: Number(item.reps) || 10,
                            notes: item.notes || null,
                        }
                    });
                }
            }
            return workout;
        });
    } else if (plan.type === "DIET") {
        // 1. Resolver comidas fuera de la transacción para evitar envenenar P2002
        let dbMeals: Record<string, string> = {};
        const safeDays = Array.isArray(plan.days) ? plan.days : [];
        for (const day of safeDays) {
            const items = day?.items || day?.exercises || day?.meals || [];
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (!item || !item.name) continue;
                const itemName = String(item.name).trim();
                if (dbMeals[itemName]) continue;

                let dbM = await (prisma as any).meal.findFirst({
                    where: { name: { equals: itemName, mode: 'insensitive' } }
                });
                if (!dbM) {
                    try {
                        dbM = await (prisma as any).meal.create({
                            data: { name: itemName, description: 'Generada por AI' }
                        });
                    } catch (e: any) {
                        if (e.code === 'P2002') {
                            dbM = await (prisma as any).meal.findFirst({ where: { name: itemName } });
                        }
                    }
                }
                if (dbM) dbMeals[itemName] = dbM.id;
            }
        }

        // 2. Ejecutar transacción segura
        return prisma.$transaction(async (tx) => {
            const diet = await tx.diet.create({
                data: {
                    userId,
                    name: plan.name || 'Plan de Nutrición',
                    description: plan.description || 'Generado por IA',
                }
            });

            for (let d = 0; d < safeDays.length; d++) {
                const day = safeDays[d];
                if (!day) continue;
                const items = day.items || day.exercises || day.meals || [];
                if (!Array.isArray(items)) continue;

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (!item || !item.name) continue;
                    const itemName = String(item.name).trim();
                    const mealId = dbMeals[itemName];
                    if (!mealId) continue;

                    const typeLower = itemName.toLowerCase();
                    let mealType = "almuerzo";
                    if (typeLower.includes("desayuno") || typeLower.includes("breakfast")) mealType = "desayuno";
                    else if (typeLower.includes("cena") || typeLower.includes("dinner")) mealType = "cena";
                    else if (typeLower.includes("merienda") || typeLower.includes("snack")) mealType = "merienda";

                    await tx.dietMeal.create({
                        data: {
                            dietId: diet.id,
                            mealId: mealId,
                            dayOfWeek: typeof day?.dayOfWeek === 'number' ? day.dayOfWeek : (d + 1),
                            mealType: mealType,
                            order: i,
                            notes: item.quantity ? `${item.quantity}. ${item.notes || ''}` : (item.notes || null),
                        }
                    });
                }
            }
            return diet;
        });
    } else {
        throw new Error('Tipo de plan no soportado (debe ser WORKOUT o DIET)');
    }
}
