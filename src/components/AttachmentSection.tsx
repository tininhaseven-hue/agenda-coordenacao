'use client';

import { useState, useEffect, useCallback } from 'react';
import Dexie, { type EntityTable } from 'dexie';
import { AudioRecorder } from './AudioRecorder';

export interface Attachment {
  id: string;
  taskId: string;
  date: string;
  store: string;
  type: 'pdf' | 'audio';
  name: string;
  blob: Blob;
  createdAt: number;
}

// Criar um DB Local (Dexie) apenas para Anexos (Blobs grandes)
const localDb = new Dexie('AgendaAttachments') as Dexie & {
  attachments: EntityTable<Attachment, 'id'>;
};

localDb.version(1).stores({
  attachments: 'id, taskId, date, store'
});

interface AttachmentSectionProps {
  taskId: string;
  date: string;
  store: string;
  onAttachmentsChange?: (ids: string[]) => void;
  currentAttachmentIds?: string[];
}

export function AttachmentSection({ 
  taskId, date, store, onAttachmentsChange, currentAttachmentIds = [] 
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Carregar anexos existentes para esta tarefa específica
  const loadAttachments = useCallback(async () => {
    try {
      const results = await localDb.attachments
        .where('taskId').equals(taskId)
        .and(a => a.date === date && a.store === store)
        .toArray();
      setAttachments(results);
    } catch (err) {
      console.error('Erro ao carregar anexos:', err);
    }
  }, [taskId, date, store]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments, currentAttachmentIds]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas ficheiros PDF são permitidos aqui.');
      return;
    }

    setIsUploading(true);
    try {
      const id = `${taskId}_${Date.now()}`;
      const newAttachment: Attachment = {
        id,
        taskId,
        date,
        store,
        type: 'pdf',
        name: file.name,
        blob: file,
        createdAt: Date.now()
      };

      await localDb.attachments.add(newAttachment);
      await loadAttachments();
      
      const newIds = [...attachments.map(a => a.id), id];
      onAttachmentsChange?.(newIds);
    } catch (err) {
      console.error('Erro ao guardar PDF:', err);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Limpar input
    }
  };

  const handleAudioSaved = async (blob: Blob) => {
    try {
      const id = `audio_${taskId}_${Date.now()}`;
      const newAttachment: Attachment = {
        id,
        taskId,
        date,
        store,
        type: 'audio',
        name: `Gravação de Áudio ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`,
        blob: blob,
        createdAt: Date.now()
      };

      await localDb.attachments.add(newAttachment);
      await loadAttachments();
      
      const newIds = [...attachments.map(a => a.id), id];
      onAttachmentsChange?.(newIds);
    } catch (err) {
      console.error('Erro ao guardar Áudio:', err);
    }
  };

  const removeAttachment = async (id: string) => {
    if (!confirm('Eliminar este anexo?')) return;
    try {
      await localDb.attachments.delete(id);
      await loadAttachments();
      
      const newIds = attachments.filter(a => a.id !== id).map(a => a.id);
      onAttachmentsChange?.(newIds);
    } catch (err) {
      console.error('Erro ao eliminar anexo:', err);
    }
  };

  const openAttachment = (a: Attachment) => {
    const url = URL.createObjectURL(a.blob);
    window.open(url, '_blank');
  };

  return (
    <div className="attachment-section" style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        Documentos e Áudios
        <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{attachments.length} anexos</span>
      </h3>

      <div className="attachment-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {attachments.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '1.1rem' }}>{a.type === 'pdf' ? '📄' : '🎵'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.name}
              </p>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {new Date(a.createdAt).toLocaleDateString('pt-PT')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={() => openAttachment(a)}
                style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Abrir
              </button>
              <button 
                onClick={() => removeAttachment(a.id)}
                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', padding: '1rem', margin: 0, fontStyle: 'italic' }}>
            Nenhum anexo disponível
          </p>
        )}
      </div>

      <div className="attachment-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
        <div>
          <label className="upload-btn" style={{ 
            display: 'block', padding: '0.75rem', border: '2px dashed #cbd5e1', borderRadius: '8px', 
            textAlign: 'center', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: 600,
            transition: 'all 0.2s'
          }}>
            {isUploading ? 'A processar...' : '➕ Anexar Ficheiro PDF'}
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>
        </div>

        <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <AudioRecorder onStop={handleAudioSaved} />
        </div>
      </div>
    </div>
  );
}
