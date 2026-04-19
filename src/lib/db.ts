import { createClient, type Client } from '@libsql/client';

const isVercel = process.env.VERCEL === '1';
const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let _rawClient: Client | null = null;

function getClient() {
  if (!_rawClient) {
    _rawClient = createClient({
      // No Vercel em produção, usamos o Turso. Localmente usamos um ficheiro.
      url: tursoUrl || 'file:agenda.db',
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
  if (isMock) return;

  try {
    // Sincronização Genérica baseada em Chaves (espelha LocalStorage)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS SyncData (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt INTEGER
      );
    `);

    // Tabela para os Projetos
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
