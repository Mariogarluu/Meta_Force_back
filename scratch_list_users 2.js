import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USUARIOS EN LA BASE DE DATOS ---');
  console.log(users.map(u => ({ id: u.id, email: u.email, name: u.name, status: u.status, role: u.role })));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
