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
        items: {
            name: string;
            sets?: number;
            reps?: number;
            quantity?: string;
            notes?: string;
        }[];
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
                        "items": [
                            {
                                "name": "Nombre Ejercicio o Comida",
                                "sets": 4, // Solo si es WORKOUT
                                "reps": 10, // Solo si es WORKOUT
                                "quantity": "1 porción", // Solo si es DIET
                                "notes": "Notas" 
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
                take: 1
            }
        }
    });
}

/**
 * Guarda un plan generado por la IA en la base de datos (Workout o Diet)
 */
export async function saveAiPlan(userId: string, plan: AiGeneratedPlan) {
    if (plan.type === "WORKOUT") {
        return prisma.$transaction(async (tx) => {
            // 1. Crear Entrenamiento
            const workout = await tx.workout.create({
                data: {
                    userId,
                    name: plan.name,
                    description: plan.description,
                }
            });

            // 2. Procesar días y ejercicios
            for (const day of plan.days) {
                if (!day.items) continue;
                for (let i = 0; i < day.items.length; i++) {
                    const item = day.items[i];
                    if (!item) continue;

                    // Buscar si existe un ejercicio con ese nombre (case insensitive approx)
                    let dbExercise = await tx.exercise.findFirst({
                        where: { name: { contains: item.name, mode: 'insensitive' } }
                    });

                    // Si no existe, crearlo al vuelo
                    if (!dbExercise) {
                        dbExercise = await tx.exercise.create({
                            data: {
                                name: item.name,
                                description: 'Generado por AI'
                            }
                        });
                    }

                    // Vincular al entrenamiento
                    await tx.workoutExercise.create({
                        data: {
                            workoutId: workout.id,
                            exerciseId: dbExercise.id,
                            dayOfWeek: day.dayOfWeek,
                            order: i,
                            sets: item.sets || 3,
                            reps: item.reps || 10,
                            notes: item.notes || null,
                        }
                    });
                }
            }

            return workout;
        });
    } else if (plan.type === "DIET") {
        return prisma.$transaction(async (tx) => {
            // 1. Crear Dieta
            const diet = await tx.diet.create({
                data: {
                    userId,
                    name: plan.name,
                    description: plan.description,
                }
            });

            // 2. Procesar días y comidas
            for (const day of plan.days) {
                if (!day.items) continue;
                for (let i = 0; i < day.items.length; i++) {
                    const item = day.items[i];
                    if (!item) continue;

                    // Buscar si existe una comida
                    let dbMeal = await tx.meal.findFirst({
                        where: { name: { contains: item.name, mode: 'insensitive' } }
                    });

                    // Si no existe, crearla
                    if (!dbMeal) {
                        dbMeal = await tx.meal.create({
                            data: {
                                name: item.name,
                                description: 'Generada por AI'
                            }
                        });
                    }

                    // Vincular a la dieta
                    // Asignamos un mealType genérico o adivinado
                    const typeLower = item.name.toLowerCase();
                    let mealType = "almuerzo";
                    if (typeLower.includes("desayuno")) mealType = "desayuno";
                    else if (typeLower.includes("cena")) mealType = "cena";
                    else if (typeLower.includes("merienda")) mealType = "merienda";

                    await tx.dietMeal.create({
                        data: {
                            dietId: diet.id,
                            mealId: dbMeal.id,
                            dayOfWeek: day.dayOfWeek,
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
