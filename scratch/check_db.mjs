import { createClient } from '@libsql/client';
import fs from 'fs';

// Função simples para ler .env.local sem dependências
function getEnv() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim();
    }
  });
  return env;
}

const env = getEnv();
const url = env.TURSO_CONNECTION_URL;
const token = env.TURSO_AUTH_TOKEN;

console.log('--- Diagnóstico de Base de Dados (Manual) ---');
console.log('URL:', url);

if (!url || !token) {
  console.error('ERRO: Variáveis não encontradas no .env.local');
  process.exit(1);
}

const client = createClient({
  url: url.startsWith('libsql://') ? url.replace('libsql://', 'https://') : url,
  authToken: token,
});

async function test() {
  try {
    console.log('A tentar executar SELECT 1...');
    const result = await client.execute("SELECT 1 as test");
    console.log('SUCESSO: Ligação estabelecida. Resultado:', result.rows);
    
    console.log('A tentar criar tabela SyncData...');
    await client.execute("CREATE TABLE IF NOT EXISTS SyncData (key TEXT PRIMARY KEY, value TEXT, updatedAt INTEGER)");
    console.log('SUCESSO: Tabela SyncData verificada/criada.');
    
    console.log('Teste concluído com sucesso!');
  } catch (e) {
    console.error('FALHA NO TESTE:', e.message);
    if (e.message.includes('400')) {
      console.log('\n--- ANÁLISE DO ERRO 400 ---');
      console.log('O Turso retornou Bad Request. Isto geralmente significa que:');
      console.log('1. A URL da base de dados no Turso mudou ou está errada.');
      console.log('2. O Token expirou ou não tem permissões de escrita.');
      console.log('3. O nome da base de dados no comando não condiz com a URL.');
    }
  }
}

test();
