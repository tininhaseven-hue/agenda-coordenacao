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

const backupPath = 'c:\\Users\\Ana\\Downloads\\backup_agenda_2026-04-24.json';

async function mergeAndRestore() {
  console.log(`Lendo backup de: ${backupPath}`);
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  // 1. Obter dados atuais da nuvem
  const cloudResult = await client.execute("SELECT * FROM SyncData");
  const cloudMap = {};
  cloudResult.rows.forEach(row => {
    cloudMap[row.key] = row.value;
  });

  const now = Date.now() + 600000; // 10 minutos no futuro para garantir vitória
  let count = 0;

  const keysToProcess = new Set([...Object.keys(backupData), ...Object.keys(cloudMap)]);

  for (const key of keysToProcess) {
    if (key.startsWith('sync_ts_')) continue;

    let finalValue = backupData[key];
    const cloudValue = cloudMap[key];

    // Lógica de Merge para projetos
    if (key === 'projects_global' && cloudValue && finalValue) {
        console.log("Mesclando projects_global...");
        try {
            const backupProjects = JSON.parse(finalValue);
            const cloudProjects = JSON.parse(cloudValue);
            
            const mergedProjectsMap = {};
            backupProjects.forEach(p => mergedProjectsMap[p.id] = p);
            
            cloudProjects.forEach(cp => {
                if (!mergedProjectsMap[cp.id]) {
                    mergedProjectsMap[cp.id] = cp;
                } else {
                    const bp = mergedProjectsMap[cp.id];
                    
                    if (cp.type === 'PLANNER') {
                        const mergedPlanner = { ...(bp.plannerData || {}), ...(cp.plannerData || {}) };
                        // Preferir notas mais longas ou do backup se cloud parecer vazia/default
                        const bestNotes = (cp.projectNotes?.length > (bp.projectNotes?.length || 0)) ? cp.projectNotes : bp.projectNotes;
                        mergedProjectsMap[cp.id] = { ...bp, ...cp, plannerData: mergedPlanner, projectNotes: bestNotes };
                    } else {
                        // Para outros tipos, preferimos a cloud se tiver mais conteúdo (ex: tarefas)
                        mergedProjectsMap[cp.id] = { ...bp, ...cp };
                    }
                }
            });
            
            finalValue = JSON.stringify(Object.values(mergedProjectsMap));
        } catch (e) {
            console.error("Erro ao mesclar projetos:", e);
        }
    } else if (!finalValue) {
        finalValue = cloudValue;
    }

    const futureTs = Date.now() + 3600000; // 1 hora no futuro para "trancar" contra sobrescritas acidentais

    try {
      await client.execute({
        sql: `INSERT INTO SyncData (key, value, updatedAt) 
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updatedAt = excluded.updatedAt`,
        args: [key, finalValue, futureTs]
      });
      
      const tsKey = `sync_ts_${key}`;
      await client.execute({
        sql: `INSERT INTO SyncData (key, value, updatedAt) 
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updatedAt = excluded.updatedAt`,
        args: [tsKey, futureTs.toString(), futureTs]
      });

      count++;
    } catch (e) {
      console.error(`Erro ao processar chave ${key}:`, e);
    }
  }

  console.log(`Mesclagem e Restauração concluída! Total: ${count} chaves.`);
}

mergeAndRestore().catch(console.error);
