/**
 * Script de inicialización que establece DATABASE_URL antes de cualquier operación de Prisma.
 * Este archivo se puede requerir al inicio de cualquier script que use Prisma.
 */
import 'dotenv/config';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = process.env;

if (DB_USER && DB_PASSWORD && DB_DATABASE && !process.env.DATABASE_URL) {
  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const host = DB_HOST || 'localhost';
  const port = DB_PORT || '5432';
  const database = DB_DATABASE;
  
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  console.log('✅ DATABASE_URL establecida desde variables separadas');
}

