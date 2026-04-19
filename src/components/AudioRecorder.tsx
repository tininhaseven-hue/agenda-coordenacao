'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onStop: (blob: Blob) => void;
  maxMinutes?: number;
}

export function AudioRecorder({ onStop, maxMinutes = 3 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onStop(blob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);

      timerInterval.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxMinutes * 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Erro ao aceder ao microfone:', err);
      alert('Não foi possível aceder ao microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="audio-recorder">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {!isRecording ? (
          <button 
            type="button"
            className="record-btn"
            onClick={startRecording}
            style={{ 
              backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '42px', height: '42px', 
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            🎤
          </button>
        ) : (
          <button 
            type="button"
            className="stop-btn"
            onClick={stopRecording}
            style={{ 
              backgroundColor: '#1e293b', color: 'white', borderRadius: '50%', width: '42px', height: '42px', 
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 1.5s infinite'
            }}
          >
            ⏹️
          </button>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isRecording ? '#ef4444' : '#64748b' }}>
            {isRecording ? `A gravar... ${formatDuration(duration)}` : (audioUrl ? 'Gravação concluída' : 'Gravar Áudio (máx. 3m)')}
          </div>
          {isRecording && (
            <div style={{ width: '100%', height: '4px', background: '#fee2e2', borderRadius: '2px', marginTop: '4px' }}>
              <div 
                style={{ 
                  height: '100%', background: '#ef4444', borderRadius: '2px', 
                  width: `${(duration / (maxMinutes * 60)) * 100}%`,
                  transition: 'width 1s linear'
                }} 
              />
            </div>
          )}
        </div>
      </div>

      {audioUrl && !isRecording && (
        <div style={{ marginTop: '0.75rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
          <audio src={audioUrl} controls style={{ width: '100%', height: '32px' }} />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
