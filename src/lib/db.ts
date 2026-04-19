import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1';
const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// Local DB path (only for local dev)
const dbPath = path.join(process.cwd(), 'data');
if (!isVercel && !fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

let _rawClient: any = null;

function getClient() {
  if (!_rawClient) {
    _rawClient = createClient({
      url: tursoUrl || `file:${path.join(dbPath, 'agenda.db')}`,
      authToken: tursoToken,
    });
  }
  return _rawClient;
}

const isMock = isVercel && !tursoUrl;

const db = {
  execute: async (args: any) => {
    if (isMock) {
      console.warn('DB MOCK MODE: Execution skipped (Missing TURSO_CONNECTION_URL)');
      return { rows: [], rowsAffected: 0, lastInsertRowid: undefined };
    }
    return await getClient().execute(args);
  }
};

async function initDb() {
  if (isVercel && !process.env.TURSO_CONNECTION_URL) {
    console.warn('Skipping initDb during build/runtime because TURSO_CONNECTION_URL is missing.');
    return;
  }

  try {
    // Sincronização Genérica baseada em Chaves (espelha LocalStorage)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS SyncData (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt INTEGER
      );
    `);

    // Tabela para os Projetos (para facilitação de filtros se necessário no futuro)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Projects (
        id TEXT PRIMARY KEY,
        data TEXT,
        updatedAt INTEGER
      );
    `);

    console.log('Agenda: Database initialized');
  } catch (e) {
    console.error('initDb failed:', e);
  }
}

export { initDb, isMock };
export default db;
