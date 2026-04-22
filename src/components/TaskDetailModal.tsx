'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Routine, RoutineExecution, ALL_STORES, Store, CustomTask, ChecklistItem } from '@/types';
import { AttachmentSection } from './AttachmentSection';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false, loading: () => <div style={{padding: '1rem', textAlign: 'center'}}>A carregar editor...</div> });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine;
  execution?: RoutineExecution;
  storeName: string;
  onToggle: (id: string, store: string) => void;
  onUpdateNotes: (id: string, store: string, notes: string) => void;
  onReschedule: (id: string, fromDate: string, toDate: string, store: string) => void;
  activeDateStr: string;
  isCustomTask?: boolean;
  onUpdateTask?: (id: string, store: string, updates: any) => void;
  onDelete?: (id: string, store: string) => void;
  onUpdateChecklist?: (id: string, store: string, checklist: ChecklistItem[]) => void;
  availableAreas?: string[];
  allRoutineExecutions?: Record<string, Record<string, RoutineExecution>>;
  allCustomExecutions?: Record<string, CustomTask[]>;
  onUpdateExecution?: (id: string, store: string, updates: Partial<RoutineExecution>) => void;
}

export function TaskDetailModal({ 
  isOpen, onClose, routine, execution, storeName, onToggle, onUpdateNotes, onReschedule, activeDateStr,
  isCustomTask, onUpdateTask, onDelete, onUpdateChecklist, availableAreas, allRoutineExecutions, allCustomExecutions, onUpdateExecution
}: Props) {
  const [localNotes, setLocalNotes] = useState(execution?.notes || '');
  const [localTitle, setLocalTitle] = useState(routine.title);
  const [localArea, setLocalArea] = useState(routine.area);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [activeStore, setActiveStore] = useState<Store>(storeName === 'Todas as Lojas' ? ALL_STORES[0] : storeName as Store);

  const isGlobal = storeName === 'Todas as Lojas';

  const initialChecklist = isCustomTask 
    ? allCustomExecutions?.[activeStore]?.find(t => t.id === routine.id)?.checklist || []
    : allRoutineExecutions?.[activeStore]?.[routine.id]?.checklist || [];

  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const editor = useRef(null);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: "Descreva aqui o que foi feito ou observações importantes...",
    spellcheck: true,
    language: 'pt_br',
    i18n: {
      pt_br: {
        'Sound': 'Som',
        'Interim Results': 'Resultados Temporários'
      }
    },
    toolbarButtonSize: 'small' as const,
    buttons: [
      'bold', 'strikethrough', 'italic', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'eraser'
    ],
    height: 300,
    style: {
      fontFamily: 'inherit'
    }
  }), []);

  useEffect(() => {
    if (isOpen) {
      if (storeName === 'Todas as Lojas') {
        // Encontra a primeira loja que tenha notas preenchidas
        let storeToFocus: Store = ALL_STORES[0] as Store;
        for (const s of ALL_STORES) {
          const notes = isCustomTask 
            ? allCustomExecutions?.[s]?.find(t => t.id === routine.id)?.notes
            : allRoutineExecutions?.[s]?.[routine.id]?.notes;
          
          if (notes && notes.trim() !== '' && notes !== '<p></p>' && notes !== '<p><br></p>') {
            storeToFocus = s as Store;
            break;
          }
        }

        setActiveStore(storeToFocus);
        const initialExec = isCustomTask 
          ? { notes: allCustomExecutions?.[storeToFocus]?.find(t => t.id === routine.id)?.notes || '' }
          : allRoutineExecutions?.[storeToFocus]?.[routine.id];
        setLocalNotes(initialExec?.notes || '');
      } else {
        setActiveStore(storeName as Store);
        setLocalNotes(execution?.notes || '');
      }
      setLocalTitle(routine.title);
      setLocalArea(routine.area);
      setRescheduleDate('');
    }
  }, [isOpen, execution, storeName, routine, allRoutineExecutions, allCustomExecutions, isCustomTask]);

  // Sync checklist when activeStore changes (useful in global mode)
  useEffect(() => {
    const currentChecklist = isCustomTask 
      ? allCustomExecutions?.[activeStore]?.find(t => t.id === routine.id)?.checklist || []
      : allRoutineExecutions?.[activeStore]?.[routine.id]?.checklist || [];
    setLocalChecklist(currentChecklist);
    
    // Also sync notes if in global mode and we switch focused store
    if (isGlobal) {
      const currentExec = isCustomTask 
        ? { notes: allCustomExecutions?.[activeStore]?.find(t => t.id === routine.id)?.notes || '' }
        : allRoutineExecutions?.[activeStore]?.[routine.id];
      setLocalNotes(currentExec?.notes || '');
    }
  }, [activeStore, isCustomTask, routine.id, allRoutineExecutions, allCustomExecutions, isGlobal]);

  if (!isOpen) return null;

  const handleAutoSave = (content: string) => {
    if (isGlobal) {
      setIsSaving(true);
      ALL_STORES.forEach(s => {
        if (isCustomTask && onUpdateTask) {
          onUpdateTask(routine.id, s, { notes: content });
        } else {
          onUpdateNotes(routine.id, s, content);
        }
      });
      setTimeout(() => setIsSaving(false), 1500);
    } else {
      setIsSaving(true);
      if (isCustomTask && onUpdateTask) {
        onUpdateTask(routine.id, activeStore, { notes: content });
      } else {
        onUpdateNotes(routine.id, activeStore, content);
      }
      setTimeout(() => setIsSaving(false), 1500);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isCustomTask && onUpdateTask) {
          if (isGlobal) {
            ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { photo: base64String }));
          } else {
            onUpdateTask(routine.id, activeStore, { photo: base64String });
          }
        } else if (onUpdateExecution) {
          if (isGlobal) {
            ALL_STORES.forEach(s => onUpdateExecution(routine.id, s, { photo: base64String }));
          } else {
            onUpdateExecution(routine.id, activeStore, { photo: base64String });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    if (isCustomTask && onUpdateTask) {
      if (isGlobal) {
        ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { photo: '' }));
      } else {
        onUpdateTask(routine.id, activeStore, { photo: '' });
      }
    } else if (onUpdateExecution) {
      if (isGlobal) {
        ALL_STORES.forEach(s => onUpdateExecution(routine.id, s, { photo: '' }));
      } else {
        onUpdateExecution(routine.id, activeStore, { photo: '' });
      }
    }
  };

  const handleUpdateTitle = (title: string) => {
    setLocalTitle(title);
    if (isCustomTask && onUpdateTask) {
      if (isGlobal) {
        ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { title }));
      } else {
        onUpdateTask(routine.id, activeStore, { title });
      }
    }
  };

  const handleUpdateArea = (area: any) => {
    setLocalArea(area);
    if (isCustomTask && onUpdateTask) {
      if (isGlobal) {
        ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { area }));
      } else {
        onUpdateTask(routine.id, activeStore, { area });
      }
    }
  };

  const handleReschedule = () => {
    if (!rescheduleDate) return;
    if (isGlobal) {
      ALL_STORES.forEach(s => onReschedule(routine.id, activeDateStr, rescheduleDate, s));
    } else {
      onReschedule(routine.id, activeDateStr, rescheduleDate, activeStore);
    }
    onClose();
  };

  const saveChecklist = (newList: ChecklistItem[]) => {
    if (isGlobal) {
      ALL_STORES.forEach(s => {
        if (isCustomTask && onUpdateTask) {
          onUpdateTask(routine.id, s, { checklist: newList });
        } else if (onUpdateChecklist) {
          onUpdateChecklist(routine.id, s, newList);
        }
      });
    } else {
      if (isCustomTask && onUpdateTask) {
        onUpdateTask(routine.id, activeStore, { checklist: newList });
      } else if (onUpdateChecklist) {
        onUpdateChecklist(routine.id, activeStore, newList);
      }
    }
  };

  const handleAddSubTask = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = { id: Date.now().toString(), text: newChecklistText.trim(), isDone: false };
    const newList = [...localChecklist, newItem];
    setLocalChecklist(newList);
    setNewChecklistText('');
    saveChecklist(newList);
  };

  const handleToggleSubTask = (id: string) => {
    const newList = localChecklist.map(item => item.id === id ? { ...item, isDone: !item.isDone } : item);
    setLocalChecklist(newList);
    saveChecklist(newList);
  };

  const handleDeleteSubTask = (id: string, text: string) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o item "${text}"?`)) {
      const newList = localChecklist.filter(item => item.id !== id);
      setLocalChecklist(newList);
      saveChecklist(newList);
    }
  };

  const getStoreCompletion = (s: string) => {
    if (isCustomTask) {
        return allCustomExecutions?.[s]?.find(t => t.id === routine.id)?.isCompleted || false;
    }
    return allRoutineExecutions?.[s]?.[routine.id]?.completed || false;
  };

  const handleToggleAll = () => {
    let completedCount = 0;
    ALL_STORES.forEach(s => {
      if (getStoreCompletion(s)) completedCount++;
    });
    
    const shouldMarkAsDone = completedCount < ALL_STORES.length;
    
    ALL_STORES.forEach(s => {
      if (getStoreCompletion(s) !== shouldMarkAsDone) {
        onToggle(routine.id, s);
      }
    });
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <span className="modal-category">
              {isCustomTask ? 'TAREFA EXTRA' : `${routine.category} - ${routine.area}`}
            </span>
            {isCustomTask ? (
              <input 
                className="modal-title-input"
                value={localTitle}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Título da tarefa..."
              />
            ) : (
              <h2 className="modal-title">{routine.title}</h2>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {isGlobal ? (
            <div className="store-selector-banner">
              Editando dados de: <strong>{activeStore}</strong>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="store-badge-detail">Loja: {activeStore}</div>
              {isCustomTask && (routine as unknown as CustomTask).startDate && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 {(routine as unknown as CustomTask).startDate} {(routine as unknown as CustomTask).endDate ? `até ${(routine as unknown as CustomTask).endDate}` : ''}
                </div>
              )}
            </div>
          )}

          {isCustomTask && onUpdateTask && (
            <div className="detail-section" style={{ backgroundColor: '#fff9db', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #ffe066', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#856404', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Período da Tarefa</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem', fontWeight: 700 }}>Início</label>
                  <input 
                    type="date"
                    value={(routine as unknown as CustomTask).startDate || ''}
                    onChange={(e) => {
                      if (isGlobal) {
                        ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { startDate: e.target.value }));
                      } else {
                        onUpdateTask(routine.id, activeStore, { startDate: e.target.value });
                      }
                    }}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem', fontWeight: 700 }}>Fim</label>
                  <input 
                    type="date"
                    value={(routine as unknown as CustomTask).endDate || (routine as unknown as CustomTask).startDate || ''}
                    min={(routine as unknown as CustomTask).startDate || ''}
                    onChange={(e) => {
                      if (isGlobal) {
                        ALL_STORES.forEach(s => onUpdateTask(routine.id, s, { endDate: e.target.value }));
                      } else {
                        onUpdateTask(routine.id, activeStore, { endDate: e.target.value });
                      }
                    }}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Estado da Tarefa</h3>
            
            {isGlobal ? (
               <div className="store-checklist">
                 <button 
                   type="button"
                   className="toggle-all-btn" 
                   onClick={handleToggleAll}
                 >
                   Alternar Seleção para Todas
                 </button>
                 {ALL_STORES.map(s => {
                    const isDone = getStoreCompletion(s);
                    const isActive = activeStore === s;
                    return (
                      <div 
                        key={s} 
                        className={`checklist-item ${isActive ? 'active-focus' : ''}`} 
                        onClick={() => setActiveStore(s as Store)}
                      >
                        <div 
                          className={`checklist-checkbox ${isDone ? 'checked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); onToggle(routine.id, s); }}
                        >
                          {isDone && '✓'}
                        </div>
                        <span className={`checklist-label ${isDone ? 'done' : ''}`}>{s}</span>
                        {isActive && <span className="focus-indicator">●</span>}
                      </div>
                    );
                 })}
               </div>
            ) : (
              <>
                <button 
                  className={`status-toggle-btn ${execution?.completed ? 'done' : 'pending'}`}
                  onClick={() => onToggle(routine.id, activeStore)}
                >
                  {execution?.completed ? '✓ Concluída' : '○ Marcar como Concluída'}
                </button>
                {execution?.isRescheduled && (
                  <p className="rescheduled-note">Esta tarefa foi movida de outro dia.</p>
                )}
              </>
            )}
          </div>

          <div className="detail-section">
            <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
              Lista de Verificação Independente
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Checklist iterativa</span>
            </h3>
            <div className="checklist-submodule">
              {localChecklist.map(item => (
                <div key={item.id} className="subtask-item">
                  <div 
                    className={`subtask-checkbox ${item.isDone ? 'checked' : ''}`}
                    onClick={() => handleToggleSubTask(item.id)}
                  >
                    {item.isDone && '✓'}
                  </div>
                  <span className={`subtask-text ${item.isDone ? 'done' : ''}`} onClick={() => handleToggleSubTask(item.id)}>
                    {item.text}
                  </span>
                  <button className="del-subtask" onClick={() => handleDeleteSubTask(item.id, item.text)}>&times;</button>
                </div>
              ))}
              <div className="subtask-add">
                <input 
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Adicionar novo item de verificação..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                />
                <button onClick={handleAddSubTask}>+</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>Descrição / Notas {isGlobal ? '(Todas as Lojas)' : `(${activeStore})`}</h3>
                  </div>
                  <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                     <JoditEditor
                       key={`${routine.id}_${activeStore}`}
                       ref={editor}
                       value={localNotes}
                       config={editorConfig}
                       onBlur={(newContent) => setLocalNotes(newContent)}
                       onChange={(newContent) => setLocalNotes(newContent)}
                     />
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                    {isSaving && (
                      <span className="save-indicator animate-fade" style={{ color: 'var(--success-color)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>✓</span> Gravado com sucesso
                      </span>
                    )}
                    <button 
                      onClick={() => handleAutoSave(localNotes)}
                      disabled={isSaving}
                      style={{
                        padding: '0.75rem 1.5rem', 
                        backgroundColor: 'var(--primary-color)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0.75rem', 
                        fontWeight: 800, 
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        transition: 'all 0.2s ease',
                        opacity: isSaving ? 0.7 : 1
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>💾</span> Guardar Notas
                    </button>
                  </div>
                </div>

                <div style={{ width: '32px', flexShrink: 0 }}>
                  <div style={{ 
                    marginTop: '0.25rem', width: '32px', height: '32px', backgroundColor: '#f8fafc', 
                    border: '1px dashed #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' 
                  }}>
                    {(isCustomTask ? (allCustomExecutions?.[activeStore]?.find(t => t.id === routine.id)?.photo) : execution?.photo) ? (
                      <>
                        <img 
                          src={isCustomTask ? (allCustomExecutions?.[activeStore]?.find(t => t.id === routine.id)?.photo) : execution?.photo} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          alt="Evidência" 
                        />
                        <button 
                          onClick={handleRemovePhoto}
                          style={{ 
                            position: 'absolute', top: '0', right: '0', backgroundColor: 'rgba(239, 68, 68, 0.9)', 
                            color: 'white', border: 'none', borderRadius: '50%', width: '14px', height: '14px', cursor: 'pointer',
                            fontSize: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                          }}
                        >✕</button>
                      </>
                    ) : (
                      <label style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <span style={{ fontSize: '0.9rem' }}>📷</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          style={{ display: 'none' }} 
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <AttachmentSection 
              taskId={routine.id}
              date={activeDateStr}
              store={activeStore}
              currentAttachmentIds={execution?.attachmentIds}
              onAttachmentsChange={(ids) => {
                if (isCustomTask && onUpdateTask) {
                  onUpdateTask(routine.id, activeStore, { attachmentIds: ids });
                } else if (onUpdateExecution) {
                   onUpdateExecution(routine.id, activeStore, { attachmentIds: ids });
                }
              }}
            />
          </div>

          <div className="detail-section reschedule-section">
            <h3>Reagendar</h3>
            <p className="section-help">Mover esta ocorrência para outro dia (esta tarefa desaparecerá de hoje).</p>
            <div className="reschedule-controls">
              <input 
                type="date" 
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <button 
                className="reschedule-btn"
                onClick={handleReschedule}
                disabled={!rescheduleDate}
              >
                Mover
              </button>
            </div>
          </div>
          
          {isCustomTask && availableAreas && (
            <div className="detail-section">
              <h3>Área Operacional</h3>
              <select 
                className="modal-select"
                value={localArea}
                onChange={(e) => handleUpdateArea(e.target.value)}
              >
                {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {routine.description && !isCustomTask && (
             <div className="detail-section info-section">
                <h3>Ajuda / Procedimento</h3>
                <div className="info-box">
                  {routine.description}
                </div>
             </div>
          )}

          {isCustomTask && onDelete && (
            <div className="detail-section delete-section" style={{ marginTop: '2rem', borderTop: '1px solid #fee2e2', paddingTop: '1.5rem' }}>
              <button 
                className="delete-task-btn"
                onClick={() => {
                  if (confirm('Tem a certeza que deseja eliminar esta tarefa extra?')) {
                    if (isGlobal) {
                      ALL_STORES.forEach(s => onDelete(routine.id, s));
                    } else {
                      onDelete(routine.id, activeStore);
                    }
                    onClose();
                  }
                }}
              >
                Eliminar Tarefa
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #f8fafc;
        }

        .modal-category {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          display: block;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.3;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          line-height: 1;
        }

        .modal-body {
          padding: 1.5rem;
          max-height: 70vh;
          overflow-y: auto;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-section h3 {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .status-toggle-btn {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .status-toggle-btn.pending {
          background: #f1f5f9;
          color: #475569;
          border-color: #e2e8f0;
        }

        .status-toggle-btn.done {
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        }

        textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }

        .reschedule-controls {
          display: flex;
          gap: 0.5rem;
        }

        input[type="date"] {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .reschedule-btn {
          padding: 0.5rem 1rem;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
        }

        .reschedule-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-box {
          background: #f0f9ff;
          padding: 1rem;
          border-radius: 0.75rem;
          border-left: 4px solid #0ea5e9;
          color: #0369a1;
          font-size: 0.9rem;
          white-space: pre-line;
        }

        .section-help {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: -0.5rem;
          margin-bottom: 0.5rem;
        }

        .store-checklist {
          display: flex;
          flex-direction: column;
        }

        .toggle-all-btn {
          align-self: flex-end;
          padding: 0.35rem 0.75rem;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          cursor: pointer;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }

        .toggle-all-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.6rem;
          background: #f8fafc;
          border-radius: 0.375rem;
          margin-bottom: 0.35rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
        }

        .checklist-item:hover {
          background: #f1f5f9;
        }

        .checklist-checkbox {
          width: 1.2rem;
          height: 1.2rem;
          border-radius: 0.25rem;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          color: white;
          background: transparent;
          transition: all 0.2s;
        }

        .checklist-checkbox.checked {
          background: var(--success-color);
          border-color: var(--success-color);
        }

        .checklist-label {
          font-weight: 600;
          color: #334155;
          font-size: 0.8rem;
        }

        .checklist-label.done {
          color: #94a3b8;
          text-decoration: line-through;
        }

        .checklist-item.active-focus {
          border-color: var(--primary-color);
          background: #eff6ff;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .focus-indicator {
          margin-left: auto;
          color: var(--primary-color);
          font-size: 0.6rem;
        }

        .store-selector-banner {
          background: #f1f5f9;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .save-indicator {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 700;
          animation: fadeIn 0.3s;
        }

        .store-badge-detail {
          display: inline-block;
          background: #e2e8f0;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .modal-title-input {
          width: 100%;
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          border: 1px solid transparent;
          background: transparent;
          padding: 0.25rem 0;
          margin: 0;
          outline: none;
          border-bottom: 2px solid var(--primary-color);
        }

        .modal-select {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          font-weight: 600;
          color: #1e293b;
        }

        .delete-task-btn {
          width: 100%;
          padding: 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: all 0.2s;
        }

        .delete-task-btn:hover {
          background: #fecaca;
        }

        /* Checklist Submodule Styles */
        .checklist-submodule {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .subtask-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
        }

        .subtask-checkbox {
          min-width: 1.25rem;
          height: 1.25rem;
          border-radius: 0.25rem;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .subtask-checkbox.checked {
          background: var(--success-color);
          border-color: var(--success-color);
        }

        .subtask-text {
          flex: 1;
          font-size: 0.9rem;
          color: #334155;
          cursor: pointer;
        }

        .subtask-text.done {
          text-decoration: line-through;
          color: #94a3b8;
        }

        .del-subtask {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 0.25rem;
        }

        .subtask-add {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .subtask-add input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          font-size: 0.85rem;
        }

        .subtask-add button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          width: 2rem;
          font-weight: bold;
          cursor: pointer;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
