/**
 * Utilitário de Sincronização para Cloud (Turso)
 */

const ACCESS_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN || "3955";

export async function pushToCloud(key: string, value: any) {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-pin': ACCESS_PIN
      },
      body: JSON.stringify({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      })
    });
    
    if (!response.ok) {
      console.error('Sync push failed:', await response.text());
    }
  } catch (error) {
    console.error('Sync push error:', error);
  }
}

export async function pullFromCloud() {
  try {
    const response = await fetch('/api/sync', {
      method: 'GET',
      headers: {
        'x-access-pin': ACCESS_PIN
      }
    });

    if (response.ok) {
      const { data } = await response.json();
      return data as Record<string, string>;
    }
  } catch (error) {
    console.error('Sync pull error:', error);
  }
  return null;
}

export async function autoMigrateToCloud() {
  if (typeof window === 'undefined') return;
  
  // Temporariamente removido para forçar a sincronização caso tenha falhado antes
  // const isMigrated = localStorage.getItem('initial_cloud_sync_done');
  // if (isMigrated === 'true') return;

  const allKeys = Object.keys(localStorage);
  const keysToSync = allKeys.filter(key => 
    !key.startsWith('__next') && 
    !key.startsWith('vercel') &&
    key !== 'agenda_access_granted' &&
    key !== 'initial_cloud_sync_done'
  );


  if (keysToSync.length === 0) {
    console.log('Nenhum dado local encontrado para sincronizar.');
    return;
  }

  console.log(`Detectadas ${keysToSync.length} chaves para migração.`);
  
  try {
    for (const key of keysToSync) {
      const value = localStorage.getItem(key);
      if (value) {
        await pushToCloud(key, value);
      }
    }

    localStorage.setItem('initial_cloud_sync_done', 'true');
    console.log('Sincronização silenciosa concluída.');
    
  } catch (error: any) {
    console.error('Falha na migração:', error);
  }
}
