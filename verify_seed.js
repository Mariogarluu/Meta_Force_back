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

async function check() {
  try {
    await client.connect();
    const centers = await client.query('SELECT count(*) FROM "Center"');
    const users = await client.query('SELECT count(*) FROM "User"');
    console.log(`Centros creados: ${centers.rows[0].count}`);
    console.log(`Usuarios creados: ${users.rows[0].count}`);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
