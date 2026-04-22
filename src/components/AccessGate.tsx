"use client";

import { useState, useEffect } from 'react';
import { fullTwoWaySync } from '@/utils/syncUtils';


interface AccessGateProps {
  children: React.ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // O PIN deve preferencialmente vir de uma variável de ambiente na Vercel
  const CORRECT_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN || "3955"; 

  const handleSyncStatus = (status: 'idle' | 'success' | 'error', message?: string) => {
    setSyncStatus(status);
    if (message) setSyncError(message);
  };

  useEffect(() => {
    // Verificar se já está autorizado neste navegador
    const authStatus = localStorage.getItem('agenda_access_granted');
    if (authStatus === 'true') {
      setIsAuthorized(true);
      fullTwoWaySync(handleSyncStatus); 
    }
    setIsLoading(false);
  }, []);

  const handlePinSubmit = (digit: string) => {
    if (pin.length >= 4) return;
    
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === CORRECT_PIN) {
        localStorage.setItem('agenda_access_granted', 'true');
        setIsAuthorized(true);
        fullTwoWaySync(handleSyncStatus); 
      } else {
        setTimeout(() => {
          setPin('');
          setError(true);
        }, 300);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  if (isLoading) return null;

  const handleLogout = () => {
    localStorage.removeItem('agenda_access_granted');
    setIsAuthorized(false);
    setPin('');
  };

  if (isAuthorized) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: '0.75rem',
          right: '1rem',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* LED de Diagnóstico */}
          <div 
            title={syncError || (syncStatus === 'success' ? 'Sincronizado' : 'A aguardar...')}
            onClick={() => alert(`Status Sinc: ${syncStatus}\n${syncError || (syncStatus === 'success' ? 'Tudo OK' : 'Sem erros detetados ainda.')}`)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: syncStatus === 'success' ? '#22c55e' : syncStatus === 'error' ? '#ef4444' : '#64748b',
              boxShadow: syncStatus === 'success' ? '0 0 8px #22c55e' : syncStatus === 'error' ? '0 0 8px #ef4444' : 'none',
              cursor: 'pointer'
            }}
          />
          
          <button 
            onClick={async () => {
               try {
                 await fullTwoWaySync(handleSyncStatus);
                 alert('✅ Sincronizado!');
               } catch (e) {
                 alert('❌ Falha na sincronização.');
               }
            }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 <span className="hide-mobile">Sync</span>
          </button>

          <button 
            onClick={() => {
              const data: Record<string, string | null> = {};
              Object.keys(localStorage).forEach(key => {
                if (!key.startsWith('__next')) data[key] = localStorage.getItem(key);
              });
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_agenda_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Backup Local"
          >
            💾 <span className="hide-mobile">Backup</span>
          </button>
          
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Sair
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'sans-serif',
      color: 'white',
      overflowY: 'auto',
      padding: '2rem 0'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Agenda de Coordenação</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Introduza o PIN para aceder</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              backgroundColor: pin.length > i ? '#3b82f6' : '#334155',
              border: error ? '2px solid #ef4444' : 'none',
              transition: 'all 0.2s'
            }}
          />
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1rem',
        maxWidth: '280px',
        marginBottom: '3rem'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button 
            key={n}
            onClick={() => handlePinSubmit(n.toString())}
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {n}
          </button>
        ))}
        <button 
          onClick={handleClear}
          style={{
            gridColumn: 'span 1',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Limpar
        </button>
        <button 
          onClick={() => handlePinSubmit("0")}
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1e293b',
            color: 'white',
            fontSize: '1.25rem',
            cursor: 'pointer'
          }}
        >
          0
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '2rem', fontSize: '0.875rem' }}>PIN Incorreto</p>}
    </div>
  );
}

