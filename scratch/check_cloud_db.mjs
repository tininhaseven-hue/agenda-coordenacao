import db, { initDb } from '../src/lib/db.ts';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  try {
    await initDb();
    const result = await db.execute('SELECT count(*) as count FROM SyncData');
    console.log('Total de chaves sincronizadas na nuvem:', result.rows[0].count);
    
    const sample = await db.execute('SELECT key FROM SyncData LIMIT 5');
    console.log('Amostra de chaves:', sample.rows.map(r => r.key));
  } catch (e) {
    console.error('Erro ao verificar DB:', e);
  }
}

check();
