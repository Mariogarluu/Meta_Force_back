import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando centro "gymprep"...');
  
  // 1. Buscar el centro creado en la UI
  const center = await prisma.center.findFirst({
    where: { name: 'gymprep' } // Asegúrate que el nombre coincida exactamente
  });

  if (!center) {
    console.error('❌ Error: No se encontró el centro "gymprep". Asegúrate de crearlo en el Dashboard primero.');
    process.exit(1);
  }

  console.log(`✅ Centro encontrado: ${center.name} (${center.id})`);

  // 2. Datos del usuario
  const email = 'admin@gymprep.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Crear o actualizar el usuario asignándole el rol y el centro
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN_CENTER',
      centerId: center.id // <--- Aquí vinculamos la seguridad
    },
    create: {
      email,
      name: 'Admin Gymprep',
      passwordHash: hashedPassword,
      role: 'ADMIN_CENTER',
      centerId: center.id
    }
  });

  console.log('\n=============================================');
  console.log('✅ USUARIO DE PRUEBA CREADO EXITOSAMENTE');
  console.log('=============================================');
  console.log(`👤 Usuario: ${user.email}`);
  console.log(`🔑 Contraseña: ${password}`);
  console.log(`Gd: Rol: ${user.role}`);
  console.log(`🏢 Asignado a: ${center.name}`);
  console.log('=============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });