import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

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

const backupPath = 'c:\\Users\\Ana\\Downloads\\backup_agenda_2026-04-24.json';

async function restore() {
  console.log(`Lendo backup de: ${backupPath}`);
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  // Prioridade Máxima para projects_global
  const keys = ['projects_global', ...Object.keys(data).filter(k => k !== 'projects_global')];
  
  // Usar um timestamp no futuro para garantir que vença qualquer conflito imediato
  const now = Date.now() + 300000; // +5 minutos no futuro
  let count = 0;

  for (const key of keys) {
    if (key.startsWith('sync_ts_')) continue; // Vamos gerir os timestamps manualmente

    const value = data[key];
    const updatedAt = now;

    try {
      await client.execute({
        sql: `INSERT INTO SyncData (key, value, updatedAt) 
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updatedAt = excluded.updatedAt`,
        args: [key, value, updatedAt]
      });
      
      // Atualizar também o timestamp correspondente para garantir que os clientes vejam como NOVO
      const tsKey = `sync_ts_${key}`;
      await client.execute({
        sql: `INSERT INTO SyncData (key, value, updatedAt) 
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updatedAt = excluded.updatedAt`,
        args: [tsKey, updatedAt.toString(), updatedAt]
      });

      count++;
      if (count % 10 === 0) console.log(`Restaurados: ${count}/${keys.length}`);
    } catch (e) {
      console.error(`Erro ao restaurar chave ${key}:`, e);
    }
  }

  console.log(`Restauração AGRESSIVA concluída! Total: ${count} chaves.`);
}

restore().catch(console.error);
