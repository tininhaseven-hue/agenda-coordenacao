"use client";

import { useState, useEffect } from 'react';
import { autoMigrateToCloud } from '@/utils/syncUtils';


interface AccessGateProps {
  children: React.ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // O PIN deve preferencialmente vir de uma variável de ambiente na Vercel
  const CORRECT_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN || "3955"; 

  useEffect(() => {
    // Verificar se já está autorizado neste navegador
    const authStatus = localStorage.getItem('agenda_access_granted');
    if (authStatus === 'true') {
      setIsAuthorized(true);
      autoMigrateToCloud(setSyncMessage); // Sincronização automática silenciosa
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
        autoMigrateToCloud(setSyncMessage); // Sincronização automática silenciosa
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

  if (isAuthorized) {
    return (
      <>
        {syncMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 10000,
            transition: 'all 0.5s'
          }}>
            {syncMessage}
          </div>
        )}
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
      color: 'white'
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
        maxWidth: '280px'
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

      {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>PIN Incorreto</p>}
    </div>
  );
}
