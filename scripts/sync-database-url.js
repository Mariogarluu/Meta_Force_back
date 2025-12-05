/**
 * Script para sincronizar DATABASE_URL en el archivo .env
 * desde las variables separadas (DB_USER, DB_PASSWORD, etc.)
 * 
 * Ejecuta este script después de cambiar las variables de base de datos.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');

try {
  let envContent = readFileSync(envPath, 'utf-8');
  
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = process.env;
  
  if (!DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    console.error('❌ Error: Faltan variables de entorno de base de datos');
    console.error('Se requieren: DB_USER, DB_PASSWORD, DB_DATABASE');
    process.exit(1);
  }
  
  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const host = DB_HOST || 'localhost';
  const port = DB_PORT || '5432';
  const database = DB_DATABASE;
  
  const databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  
  // Actualizar o agregar DATABASE_URL en el .env
  if (envContent.includes('DATABASE_URL=')) {
    // Reemplazar la línea existente
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
  } else {
    // Agregar al final
    envContent += `\n# DATABASE_URL generada automáticamente desde variables separadas\nDATABASE_URL="${databaseUrl}"\n`;
  }
  
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ DATABASE_URL sincronizada en .env');
  console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
} catch (error) {
  console.error('❌ Error sincronizando DATABASE_URL:', error.message);
  process.exit(1);
}

