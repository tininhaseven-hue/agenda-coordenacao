import { createClient } from '@libsql/client';

async function inspect() {
  const client = createClient({
    url: 'libsql://agenda-db-tininhaseven.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MDk2NjMsImlkIjoiMDE5ZGE1ZjEtZmEwMS03NDdhLTg1NjQtNTM5Y2M5ZTMyYzI0IiwicmlkIjoiMzY2ZDJhYmUtNzI4NS00MWNiLWJiNDItZWZjOTk4ZDMzYjJkIn0.OE9C5NMFQYgogJ6E8CpCPC4MQUB9MknWE8ermPcLAUCpce7qgMjiiom84JDMgNfojeCrWNrlQwjtTUu25YWPCQ',
  });

  try {
    console.log('--- INSPEÇÃO DE DADOS TURSO ---');
    const result = await client.execute('SELECT key, length(value) as size, updatedAt FROM SyncData ORDER BY updatedAt DESC');
    
    console.table(result.rows);

    // Tentar ler especificamente os projetos
    const projects = await client.execute("SELECT value FROM SyncData WHERE key = 'projects_global'");
    if (projects.rows.length > 0) {
      const data = JSON.parse(projects.rows[0].value);
      console.log('\n--- PROJETOS ENCONTRADOS NA NUVEM ---');
      data.forEach(p => {
        console.log(`- Project: ${p.title} (ID: ${p.id})`);
        if (p.plannerData) {
          console.log(`  Planner months: ${Object.keys(p.plannerData).join(', ')}`);
        }
      });
    }

  } catch (e) {
    console.error('Erro na inspeção:', e);
  } finally {
    client.close();
  }
}

inspect();
