import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Define DATABASE_URL en .env (o exporta la variable) antes de ejecutar este script.');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function test() {
  try {
    console.log('Intentando conectar a la base de datos...');
    await client.connect();
    console.log('Conexión exitosa!');
    const res = await client.query('SELECT NOW()');
    console.log('Resultado:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Error de conexión:', err.message);
    process.exit(1);
  }
}

test();
