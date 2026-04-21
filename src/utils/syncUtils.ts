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
      const { data, isMock } = await response.json();
      return { data: data as Record<string, string>, isMock };
    } else {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }
  } catch (error: any) {
    console.error('Sync pull error:', error);
    throw error;
  }
}

export async function fullTwoWaySync(onStatus?: (status: 'idle' | 'success' | 'error', message?: string) => void) {
  if (typeof window === 'undefined') return;
  
  console.log('Iniciando sincronização completa com a nuvem...');
  let dataUpdated = false;

  try {
    // 1. PULL: Ir buscar dados à nuvem
    const { data: cloudData, isMock } = await pullFromCloud();
    
    if (isMock) {
      onStatus?.('error', 'Servidor Turso não configurado (Falta TURSO_CONNECTION_URL)');
      return;
    }

    if (cloudData) {
      console.log(`Dados da nuvem recebidos (${Object.keys(cloudData).length} itens).`);
      Object.entries(cloudData).forEach(([key, value]) => {
        const localValue = localStorage.getItem(key);
        const isEmptyLocal = !localValue || localValue === '{}';
        
        if (isEmptyLocal && value !== '{}') {
          localStorage.setItem(key, value);
          dataUpdated = true;
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
      if (value && value !== '{}') {
        if (!cloudData || cloudData[key] !== value) {
          await pushToCloud(key, value);
        }
      }
    }

    localStorage.setItem('initial_cloud_sync_done', 'true');
    console.log('Sincronização bidirecional concluída com sucesso.');
    onStatus?.('success');

    // 3. Forçar Refresh se dados novos chegaram
    if (dataUpdated) {
      console.log('Dados novos detetados! A atualizar página...');
      window.location.reload();
    }
    
  } catch (error: any) {
    console.error('Falha na sincronização bidirecional:', error);
    onStatus?.('error', error.message || 'Falha na ligação');
  }
}
