import { saveAiPlan } from './src/modules/ai/ai.service.js';
import { prisma } from './src/config/db.js';

async function main() {
    const userId = "cm7g3q9xg0000a6g6z0u7q10t"; // We need a real user ID. Let's find one.
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users found");
        return;
    }

    const plan = {
        type: "DIET" as const,
        name: "Dieta test",
        description: "test",
        days: [
            {
                dayOfWeek: 1,
                items: [
                    { name: "Avena con leche", quantity: "1 tazón", notes: "con canela" },
                    { name: "Pollo con arroz", quantity: "200g", notes: "" }
                ]
            }
        ]
    };

    try {
        const result = await saveAiPlan(user.id, plan);
        console.log("Success:", result);
    } catch (e: any) {
        console.error("Error saving plan:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
