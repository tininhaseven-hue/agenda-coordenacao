import { createClient } from '@libsql/client';

async function inspect() {
  const client = createClient({
    url: 'libsql://agenda-db-tininhaseven.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MDk2NjMsImlkIjoiMDE5ZGE1ZjEtZmEwMS03NDdhLTg1NjQtNTM5Y2M5ZTMyYzI0IiwicmlkIjoiMzY2ZDJhYmUtNzI4NS00MWNiLWJiNDItZWZjOTk4ZDMzYjJkIn0.OE9C5NMFQYgogJ6E8CpCPC4MQUB9MknWE8ermPcLAUCpce7qgMjiiom84JDMgNfojeCrWNrlQwjtTUu25YWPCQ',
  });

  try {
    const projects = await client.execute("SELECT value FROM SyncData WHERE key = 'projects_global'");
    if (projects.rows.length > 0) {
      const data = JSON.parse(projects.rows[0].value);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Erro:', e);
  } finally {
    client.close();
  }
}

inspect();
