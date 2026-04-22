'use client';

import { useState, useRef, useEffect } from 'react';
import { Project, WorkspaceBlock, BlockType, ProjectTask } from '@/types';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface ProjectWorkspaceViewProps {
  project: Project;
  blocks: WorkspaceBlock[];
  onUpdateBlock: (blockId: string, updates: Partial<WorkspaceBlock>) => void;
  onAddBlock: (type: BlockType, title: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleTask: (blockId: string, taskId: string) => void;
}

export function ProjectWorkspaceView({ 
  project, blocks, onUpdateBlock, onAddBlock, onDeleteBlock, onToggleTask 
}: ProjectWorkspaceViewProps) {
  const [isAdding, setIsAdding] = useState(false);

  const blockTypes: { type: BlockType; label: string; icon: string }[] = [
    { type: 'TEXT', label: 'Notas de Texto', icon: '📝' },
    { type: 'CHECKLIST', label: 'Lista de Tarefas', icon: '✅' },
    { type: 'TABLE', label: 'Tabela Flexível', icon: '📊' },
    { type: 'MEDIA', label: 'Media (Áudio/Ficheiros)', icon: '📎' },
    { type: 'DRAWING', label: 'Desenho/Esboço', icon: '🎨' }
  ];

  return (
    <div className="workspace-view">
      {/* Blocks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {(blocks || []).map(block => (
          <div key={block.id} className="workspace-block-card">
            <div className="block-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {blockTypes.find(t => t.type === block.type)?.icon}
                </span>
                <input 
                  type="text" 
                  value={block.title} 
                  onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
                  placeholder="Título do bloco..."
                  className="block-title-input"
                />
              </div>
              <button 
                onClick={() => {
                  if (window.confirm(`Tem a certeza que deseja eliminar o bloco "${block.title}"?`)) onDeleteBlock(block.id);
                }}
                className="delete-block-btn"
              >
                Eliminar
              </button>
            </div>

            <div className="block-content">
              {block.type === 'TEXT' && (
                <JoditEditor 
                  value={block.content || ''}
                  onBlur={(newContent) => onUpdateBlock(block.id, { content: newContent })}
                  config={{
                    readonly: false,
                    placeholder: 'Comece a escrever...',
                    height: 300
                  }}
                />
              )}

              {block.type === 'CHECKLIST' && (
                <div className="checklist-block">
                  {(block.checklist || []).map(task => (
                    <div key={task.id} className="checklist-row">
                      <div 
                        onClick={() => onToggleTask(block.id, task.id)}
                        className={`mini-checkbox ${task.isDone ? 'checked' : ''}`}
                      >
                        {task.isDone && '✓'}
                      </div>
                      <input 
                        type="text" 
                        value={task.text} 
                        onChange={(e) => {
                          const newList = (block.checklist || []).map(t => 
                            t.id === task.id ? { ...t, text: e.target.value } : t
                          );
                          onUpdateBlock(block.id, { checklist: newList });
                        }}
                        style={{ 
                          textDecoration: task.isDone ? 'line-through' : 'none',
                          color: task.isDone ? '#94a3b8' : 'inherit'
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (window.confirm(`Tem a certeza que deseja eliminar a tarefa "${task.text}"?`)) {
                            const newList = (block.checklist || []).filter(t => t.id !== task.id);
                            onUpdateBlock(block.id, { checklist: newList });
                          }
                        }}
                        className="remove-task-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newTask: ProjectTask = { id: `pt_${Date.now()}`, text: '', isDone: false };
                      onUpdateBlock(block.id, { checklist: [...(block.checklist || []), newTask] });
                    }}
                    className="add-task-btn"
                  >
                    + Adicionar Tarefa
                  </button>
                </div>
              )}

              {block.type === 'TABLE' && (
                <div className="table-block-wrapper">
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        {(block.table?.headers || []).map((h, i) => (
                          <th key={i}>
                            <input 
                              type="text" 
                              value={h} 
                              onChange={(e) => {
                                const newHeaders = [...(block.table?.headers || [])];
                                newHeaders[i] = e.target.value;
                                onUpdateBlock(block.id, { table: { ...block.table!, headers: newHeaders } });
                              }}
                            />
                            <button 
                              onClick={() => {
                                if (window.confirm(`Tem a certeza que deseja eliminar a coluna "${h}"?`)) {
                                  const newHeaders = (block.table?.headers || []).filter((_, idx) => idx !== i);
                                  const newRows = (block.table?.rows || []).map(r => r.filter((_, idx) => idx !== i));
                                  onUpdateBlock(block.id, { table: { headers: newHeaders, rows: newRows } });
                                }
                              }}
                              className="col-delete-btn"
                            >
                              ×
                            </button>
                          </th>
                        ))}
                        <th style={{ width: '40px' }}>
                          <button 
                            onClick={() => {
                              const newHeaders = [...(block.table?.headers || []), 'Nova Coluna'];
                              const newRows = (block.table?.rows || []).map(r => [...r, '']);
                              onUpdateBlock(block.id, { table: { headers: newHeaders, rows: newRows } });
                            }}
                            className="add-col-btn"
                          >
                            +
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(block.table?.rows || []).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci}>
                              <input 
                                type="text" 
                                value={cell} 
                                onChange={(e) => {
                                  const newRows = (block.table?.rows || []).map((r, idx) => 
                                    idx === ri ? r.map((c, cidx) => cidx === ci ? e.target.value : c) : r
                                  );
                                  onUpdateBlock(block.id, { table: { ...block.table!, rows: newRows } });
                                }}
                              />
                            </td>
                          ))}
                          <td>
                            <button 
                              onClick={() => {
                                if (window.confirm('Tem a certeza que deseja eliminar esta linha?')) {
                                  const newRows = (block.table?.rows || []).filter((_, idx) => idx !== ri);
                                  onUpdateBlock(block.id, { table: { ...block.table!, rows: newRows } });
                                }
                              }}
                              className="row-delete-btn"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={(block.table?.headers.length || 0) + 1}>
                          <button 
                            onClick={() => {
                              const newRow = Array((block.table?.headers.length || 1)).fill('');
                              onUpdateBlock(block.id, { table: { ...block.table!, rows: [...(block.table?.rows || []), newRow] } });
                            }}
                            className="add-row-btn"
                          >
                            + Adicionar Linha
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {block.type === 'MEDIA' && (
                <div className="media-block">
                  <div className="media-grid">
                    {(block.media || []).map(item => (
                      <div key={item.id} className="media-item">
                        <div className="media-icon">
                          {item.type === 'AUDIO' ? '🎵' : item.type === 'IMAGE' ? '🖼️' : '📄'}
                        </div>
                        <div className="media-info">
                          <span className="media-name">{item.name}</span>
                          <div className="media-actions">
                            {item.type === 'AUDIO' && <audio src={item.url} controls className="mini-player" />}
                            {item.type === 'IMAGE' && <a href={item.url} target="_blank" rel="noreferrer">Ver</a>}
                            <button 
                              onClick={() => {
                                if (window.confirm(`Tem a certeza que deseja remover o ficheiro "${item.name}"?`)) {
                                  const newList = (block.media || []).filter(i => i.id !== item.id);
                                  onUpdateBlock(block.id, { media: newList });
                                }
                              }}
                              className="delete-item-btn"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="media-upload-label">
                    <span>+ Carregar Áudio/Foto/PDF</span>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            const type = file.type.startsWith('audio/') ? 'AUDIO' : 
                                         file.type.startsWith('image/') ? 'IMAGE' : 'PDF';
                            const newItem = {
                              id: `media_${Date.now()}_${Math.random()}`,
                              name: file.name,
                              type: type as any,
                              url: re.target?.result as string
                            };
                            onUpdateBlock(block.id, { media: [...(block.media || []), newItem] });
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
              )}

              {block.type === 'DRAWING' && (
                <DrawingArea 
                  onSave={(dataUrl) => onUpdateBlock(block.id, { content: dataUrl })}
                  initialData={block.content}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Block Interface */}
      <div className="add-block-section">
        {!isAdding ? (
          <button onClick={() => setIsAdding(true)} className="add-any-block-btn">
            + Adicionar Novo Elemento
          </button>
        ) : (
          <div className="block-type-selector animate-slide-up">
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#64748b' }}>Escolha o tipo de elemento:</h4>
            <div className="block-type-grid">
              {blockTypes.map(bt => (
                <button 
                  key={bt.type} 
                  onClick={() => {
                    onAddBlock(bt.type, bt.label);
                    setIsAdding(false);
                  }}
                  className="block-type-btn"
                >
                  <span style={{ fontSize: '1.5rem' }}>{bt.icon}</span>
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsAdding(false)} className="cancel-add-btn">Cancelar</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .workspace-view {
          padding-bottom: 5rem;
        }
        .workspace-block-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px dashed #e2e8f0;
        }
        .block-title-input {
          border: none;
          font-weight: 800;
          font-size: 1.1rem;
          color: #1e293b;
          outline: none;
          background: transparent;
        }
        .delete-block-btn {
          background: #fef2f2;
          color: #ef4444;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .checklist-block {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .checklist-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 0.5rem;
        }
        .checklist-row input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-weight: 500;
        }
        .mini-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .mini-checkbox.checked {
          background: #22c55e;
          border-color: #22c55e;
          color: white;
        }
        .add-task-btn {
          background: none;
          border: 1px dashed #cbd5e1;
          padding: 0.6rem;
          border-radius: 0.5rem;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .workspace-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .workspace-table th, .workspace-table td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem;
          position: relative;
        }
        .workspace-table th {
          background: #f1f5f9;
        }
        .workspace-table input {
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          padding: 0.2rem;
        }
        .col-delete-btn, .row-delete-btn {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          border: none;
          width: 16px;
          height: 16px;
          font-size: 10px;
          cursor: pointer;
          border-radius: 0 0 0 4px;
        }
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .media-item {
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          background: #f8fafc;
        }
        .media-name {
          font-size: 0.75rem;
          font-weight: 700;
          display: block;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .media-upload-label {
          display: block;
          padding: 1.5rem;
          border: 2px dashed #cbd5e1;
          border-radius: 1rem;
          text-align: center;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
        }
        .add-block-section {
          margin-top: 3rem;
          text-align: center;
        }
        .add-any-block-btn {
          width: 100%;
          padding: 1.5rem;
          border: 2px dashed #3b82f6;
          border-radius: 1rem;
          background: #eff6ff;
          color: #3b82f6;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-any-block-btn:hover {
          background: #dbeafe;
        }
        .block-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .block-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
        }
        .block-type-btn:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .cancel-add-btn {
          margin-top: 1.5rem;
          background: none;
          border: none;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mini-player {
          height: 24px;
          width: 100px;
        }
      `}</style>
    </div>
  );
}

function DrawingArea({ onSave, initialData }: { onSave: (data: string) => void, initialData?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  }, [initialData]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
    }
  };

  return (
    <div className="drawing-container">
      <div className="drawing-toolbar">
        <button onClick={clear}>Limpar Quadro</button>
      </div>
      <canvas 
        ref={canvasRef}
        width={800}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ width: '100%', height: 'auto', background: 'white', border: '1px solid #cbd5e1', cursor: 'crosshair', borderRadius: '0.5rem' }}
      />
      <style jsx>{`
        .drawing-container {
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 0.75rem;
        }
        .drawing-toolbar {
          margin-bottom: 0.75rem;
          display: flex;
          gap: 0.5rem;
        }
        .drawing-toolbar button {
          background: white;
          border: 1px solid #cbd5e1;
          padding: 0.4rem 0.8rem;
          border-radius: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
