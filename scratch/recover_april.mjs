import { createClient } from '@libsql/client';

async function recover() {
  const client = createClient({
    url: 'libsql://agenda-db-tininhaseven.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MDk2NjMsImlkIjoiMDE5ZGE1ZjEtZmEwMS03NDdhLTg1NjQtNTM5Y2M5ZTMyYzI0IiwicmlkIjoiMzY2ZDJhYmUtNzI4NS00MWNiLWJiNDItZWZjOTk4ZDMzYjJkIn0.OE9C5NMFQYgogJ6E8CpCPC4MQUB9MknWE8ermPcLAUCpce7qgMjiiom84JDMgNfojeCrWNrlQwjtTUu25YWPCQ',
  });

  try {
    console.log('Pesquisando por dados de Abril...');
    const result = await client.execute("SELECT key FROM SyncData WHERE value LIKE '%\"month\": 3%' OR value LIKE '%\"month\": \"3\"%'");
    
    if (result.rows.length > 0) {
      console.log('Foram encontradas chaves que podem conter dados de Abril:');
      console.table(result.rows);
      
      for (const row of result.rows) {
          const val = await client.execute(`SELECT value FROM SyncData WHERE key = ?`, [row.key]);
          console.log(`\n--- CONTEÚDO DA CHAVE: ${row.key} ---`);
          console.log(val.rows[0].value.substring(0, 500) + '...');
      }
    } else {
      console.log('Não foi encontrado nenhum rasto de dados de Abril na nuvem.');
    }

  } catch (e) {
    console.error('Erro na recuperação:', e);
  } finally {
    client.close();
  }
}

recover();
