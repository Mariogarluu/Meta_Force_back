// Script para borrar solo los datos de la tabla Machine
// Esto NO afecta a otras tablas (User, Center, GymClass, etc.)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMachines() {
  try {
    console.log('Borrando datos de la tabla Machine...');
    const result = await prisma.machine.deleteMany({});
    console.log(`✅ Se borraron ${result.count} máquinas.`);
    console.log('✅ Las demás tablas (User, Center, GymClass, etc.) NO fueron afectadas.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMachines();

