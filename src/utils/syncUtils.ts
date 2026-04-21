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

export async function fullTwoWaySync() {
  if (typeof window === 'undefined') return;
  
  console.log('Iniciando sincronização completa com a nuvem...');

  try {
    // 1. PULL: Ir buscar dados à nuvem
    const cloudData = await pullFromCloud();
    if (cloudData) {
      console.log(`Dados da nuvem recebidos (${Object.keys(cloudData).length} itens).`);
      Object.entries(cloudData).forEach(([key, value]) => {
        // Só guardamos se não existir localmente (para não sobrepor o que o utilizador está a escrever agora)
        // Ou se preferir que a nuvem seja a verdade absoluta, remova o check do getItem
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, value);
        }
      });
    }

    // 2. PUSH: Enviar dados locais para a nuvem
    const allKeys = Object.keys(localStorage);
    const keysToSync = allKeys.filter(key => 
      !key.startsWith('__next') && 
      !key.startsWith('vercel') &&
      key !== 'agenda_access_granted' &&
      key !== 'initial_cloud_sync_done'
    );

    for (const key of keysToSync) {
      const value = localStorage.getItem(key);
      if (value) {
        // Só enviamos se não estiver já na nuvem com o mesmo valor (opcional, mas poupa bateria/dados)
        if (!cloudData || cloudData[key] !== value) {
          await pushToCloud(key, value);
        }
      }
    }

    localStorage.setItem('initial_cloud_sync_done', 'true');
    console.log('Sincronização bidirecional concluída com sucesso.');
    
  } catch (error: any) {
    console.error('Falha na sincronização bidirecional:', error);
  }
}
