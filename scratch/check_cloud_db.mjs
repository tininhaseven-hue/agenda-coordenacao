import db, { initDb } from '../src/lib/db.ts';

async function check() {
  try {
    // Verificar se as variáveis estão presentes no ambiente do terminal
    if (!process.env.TURSO_CONNECTION_URL) {
      console.error('ERRO: TURSO_CONNECTION_URL não definida no terminal.');
      return;
    }

    await initDb();
    const result = await db.execute('SELECT count(*) as count FROM SyncData');
    console.log('Total de chaves sincronizadas na nuvem:', result.rows[0].count);
    
    const sample = await db.execute('SELECT key FROM SyncData LIMIT 10');
    console.log('Amostra de chaves encontradas na Cloud:');
    sample.rows.forEach(r => console.log(' - ' + r.key));
    
  } catch (e) {
    console.error('Erro ao verificar DB:', e);
  }
}

check();

