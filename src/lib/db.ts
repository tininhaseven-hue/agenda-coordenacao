import { createClient, type Client } from '@libsql/client';

const isVercel = process.env.VERCEL === '1';
const tursoUrl = process.env.TURSO_CONNECTION_URL || "libsql://agenda-db-tininhaseven.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MDk2NjMsImlkIjoiMDE5ZGE1ZjEtZmEwMS03NDdhLTg1NjQtNTM5Y2M5ZTMyYzI0IiwicmlkIjoiMzY2ZDJhYmUtNzI4NS00MWNiLWJiNDItZWZjOTk4ZDMzYjJkIn0.OE9C5NMFQYgogJ6E8CpCPC4MQUB9MknWE8ermPcLAUCpce7qgMjiiom84JDMgNfojeCrWNrlQwjtTUu25YWPCQ";

let _rawClient: Client | null = null;

function getClient() {
  if (!_rawClient) {
    // Converter libsql:// para https:// automaticamente para maior compatibilidade na nuvem
    const finalUrl = tursoUrl?.startsWith('libsql://') 
      ? tursoUrl.replace('libsql://', 'https://') 
      : tursoUrl || 'file:agenda.db';

    _rawClient = createClient({
      url: finalUrl,
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
    // Criar tabelas individualmente para evitar erros de execução em lote
    await db.execute("CREATE TABLE IF NOT EXISTS SyncData (key TEXT PRIMARY KEY, value TEXT, updatedAt INTEGER)");
    await db.execute("CREATE TABLE IF NOT EXISTS Projects (id TEXT PRIMARY KEY, data TEXT, updatedAt INTEGER)");
    
    console.log('Agenda: Database initialized successfully');
  } catch (e: any) {
    console.error('initDb failed:', e);
    throw new Error(`Erro na inicialização da BD: ${e.message}`);
  }
}

export { initDb, isMock };
export default db;
