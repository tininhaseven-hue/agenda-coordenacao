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
    } else {
      const result = await response.json();
      // Gravamos localmente a hora exata a que empurrámos os dados, baseada na reposta do servidor para evitar desvios de relógio
      if (result.updatedAt) {
        localStorage.setItem('sync_ts_' + key, result.updatedAt.toString());
      }
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
      return { data: data as Record<string, { value: string, updatedAt: number }>, isMock };
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
      Object.entries(cloudData).forEach(([key, cloudItem]) => {
        const { value: cloudValue, updatedAt: cloudTs } = cloudItem;
        
        const localValue = localStorage.getItem(key);
        const isEmptyLocal = !localValue || localValue === '{}';
        
        // Verifica se a nuvem é mais recente que o último registo de sincronização que fizemos localmente
        const localTsStr = localStorage.getItem('sync_ts_' + key);
        const localTs = localTsStr ? parseInt(localTsStr, 10) : 0;
        
        const nuvemMaisRecente = cloudTs > localTs;

        if ((isEmptyLocal && cloudValue !== '{}') || nuvemMaisRecente) {
          localStorage.setItem(key, cloudValue);
          localStorage.setItem('sync_ts_' + key, cloudTs.toString());
          dataUpdated = true;
        }
      });
    }

    // 2. PUSH: Enviar dados locais para a nuvem
    const allKeys = Object.keys(localStorage);
    const keysToSync = allKeys.filter(key => 
      !key.startsWith('__next') && 
      !key.startsWith('vercel') &&
      !key.startsWith('sync_ts_') &&
      key !== 'agenda_access_granted' &&
      key !== 'initial_cloud_sync_done'
    );

    for (const key of keysToSync) {
      const localValue = localStorage.getItem(key);
      if (localValue && localValue !== '{}') {
        const cloudItem = cloudData?.[key];
        
        // Se nuvem n tem o dado, ou o local value é diferente E a nuvem não era mais recente
        if (!cloudItem || cloudItem.value !== localValue) {
           const localTsStr = localStorage.getItem('sync_ts_' + key);
           const localTs = localTsStr ? parseInt(localTsStr, 10) : 0;
           const cloudTs = cloudItem?.updatedAt || 0;
           
           // Apenas envia para a cloud se não acabámos de decidir (no PULL acima) que a Cloud era mais nova (pois caso fosse, já teríamos atualizado o localStorage e cloudItem.value === localValue)
           // Se a cloud estava desatualizada, faz update
           if (localValue !== cloudItem?.value) {
              await pushToCloud(key, localValue);
           }
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
