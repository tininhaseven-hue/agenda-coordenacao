import { createClient } from '@libsql/client';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const client = createClient({
  url: env.TURSO_CONNECTION_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

async function check() {
  const result = await client.execute({
    sql: "SELECT * FROM SyncData WHERE key = 'projects_global'",
    args: []
  });
  if (result.rows.length > 0) {
    console.log("Key: projects_global");
    console.log("UpdatedAt:", result.rows[0].updatedAt);
    console.log("Value:", result.rows[0].value);
  } else {
    console.log("Key 'projects_global' not found in DB");
  }
}

check().catch(console.error);
