'use client';

import { useState } from 'react';
import { Project, MatrixRow } from '@/types';

interface ProjectMatrixViewProps {
  project: Project;
  store: string;
  rows: MatrixRow[];
  isCellDone: (projectId: string, rowId: string, colId: string, store: string) => boolean;
  onToggleCell: (projectId: string, rowId: string, colId: string) => void;
  onAddRow: (projectId: string, name: string, store: string, hours?: number) => void;
  onDeleteRow: (projectId: string, rowId: string, store: string) => void;
  onUpdateRowHours: (projectId: string, rowId: string, store: string, hours: number) => void;
  onAddColumn: (projectId: string, colName: string) => void;
  onDeleteColumn: (projectId: string, colName: string) => void;
  onToggleTranspose: (projectId: string) => void;
}

export function ProjectMatrixView({
  project, store, rows, isCellDone, onToggleCell, onAddRow, onDeleteRow, onUpdateRowHours, onAddColumn, onDeleteColumn, onToggleTranspose
}: ProjectMatrixViewProps) {
  const [newRowName, setNewRowName] = useState('');
  const [newRowHours, setNewRowHours] = useState<number | ''>('');
  const [newColName, setNewColName] = useState('');
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [hiddenRows, setHiddenRows] = useState<string[]>([]);
  const [editingHoursRowId, setEditingHoursRowId] = useState<string | null>(null);
  const [editHoursValue, setEditHoursValue] = useState<number | ''>('');

  if (!project.matrixConfig) return null;

  const { columns } = project.matrixConfig;

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRowName.trim()) {
      onAddRow(project.id, newRowName.trim(), store, newRowHours === '' ? undefined : Number(newRowHours));
      setNewRowName('');
      setNewRowHours('');
    }
  };

  const handleAddCol = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      onAddColumn(project.id, newColName.trim());
      setNewColName('');
    }
  };

  const visibleColumns = columns.filter(c => !hiddenCols.includes(c));
  const visibleRows = rows.filter(r => !hiddenRows.includes(r.id));

  const isTransposed = project.matrixConfig.isTransposed || false;

  return (
    <div className="project-matrix-view animate-fade" style={{ marginTop: '1.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => onToggleTranspose(project.id)}
          style={{ 
            padding: '0.5rem 1rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', 
            borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <span>🔄</span> {isTransposed ? 'Nomes na Lateral' : 'Nomes no Topo (Transpor)'}
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', tableLayout: 'auto', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
               <th style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'left', minWidth: '200px', fontSize: '0.85rem' }}>
                 {isTransposed ? 'Módulos / Cursos' : 'Colaborador / Item'}
               </th>
               {!isTransposed ? (
                 visibleColumns.map(col => (
                   <th key={col} style={{ 
                     padding: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.75rem', 
                     minWidth: '100px', position: 'relative'
                   }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                       <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{col}</span>
                       <div className="no-print" style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #eee', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                          <button onClick={() => setHiddenCols([...hiddenCols, col])} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer' }} title="Ocultar">👁️‍🗨️</button>
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               if (window.confirm(`⚠️ ELIMINAR MÓDULO: Tem a certeza absoluta que deseja apagar o curso "${col}"?`)) {
                                 onDeleteColumn(project.id, col);
                               }
                            }} 
                            style={{ background: 'transparent', border: 'none', color: '#fca5a5', fontSize: '0.7rem', cursor: 'pointer' }} 
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                       </div>
                     </div>
                   </th>
                 ))
               ) : (
                 visibleRows.map(row => (
                   <th key={row.id} style={{ 
                     padding: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.75rem', 
                     minWidth: '120px', position: 'relative'
                   }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                       <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{row.name}</span>
                       {editingHoursRowId === row.id ? (
                         <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                           <input 
                             type="number" 
                             autoFocus
                             value={editHoursValue} 
                             onChange={(e) => setEditHoursValue(e.target.value === '' ? '' : Number(e.target.value))}
                             onBlur={() => {
                               onUpdateRowHours(project.id, row.id, store, Number(editHoursValue) || 0);
                               setEditingHoursRowId(null);
                             }}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 onUpdateRowHours(project.id, row.id, store, Number(editHoursValue) || 0);
                                 setEditingHoursRowId(null);
                               }
                             }}
                             style={{ width: '45px', padding: '0.1rem 0.2rem', fontSize: '0.7rem', border: '1px solid #FF7300', borderRadius: '4px', textAlign: 'center' }}
                           />
                           <span style={{ fontSize: '0.7rem' }}>h</span>
                         </div>
                       ) : (
                         <div 
                           onClick={() => {
                             setEditingHoursRowId(row.id);
                             setEditHoursValue(row.hours ?? 0);
                           }}
                           className="no-print"
                           style={{ 
                             fontSize: '0.65rem', 
                             color: (row.hours || 0) < 40 ? '#ef4444' : '#22c55e', 
                             cursor: 'pointer',
                             fontWeight: 800,
                             display: 'flex',
                             alignItems: 'center',
                             gap: '2px',
                             padding: '2px 4px',
                             borderRadius: '4px',
                             backgroundColor: '#f1f5f9'
                           }}
                           title="Clique para editar horas"
                         >
                           {row.hours !== undefined ? `${row.hours}h` : '0h'}
                           <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>✏️</span>
                         </div>
                       )}
                       <div className="no-print" style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #eee', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                          <button onClick={() => setHiddenRows([...hiddenRows, row.id])} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer' }} title="Ocultar">👁️‍🗨️</button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`⚠️ ELIMINAR PESSOA: Tem a certeza que deseja apagar o registo de "${row.name}" nesta unidade?`)) {
                                onDeleteRow(project.id, row.id, store);
                              }
                            }} 
                            style={{ background: 'transparent', border: 'none', color: '#fca5a5', fontSize: '0.7rem', cursor: 'pointer' }} 
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                       </div>
                     </div>
                   </th>
                 ))
               )}
            </tr>
          </thead>
          <tbody>
            {!isTransposed ? (
              visibleRows.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        {row.name}
                        {editingHoursRowId === row.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <input 
                              type="number" 
                              autoFocus
                              value={editHoursValue} 
                              onChange={(e) => setEditHoursValue(e.target.value === '' ? '' : Number(e.target.value))}
                              onBlur={() => {
                                onUpdateRowHours(project.id, row.id, store, Number(editHoursValue) || 0);
                                setEditingHoursRowId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onUpdateRowHours(project.id, row.id, store, Number(editHoursValue) || 0);
                                  setEditingHoursRowId(null);
                                }
                              }}
                              style={{ width: '45px', padding: '0.1rem 0.2rem', fontSize: '0.7rem', border: '1px solid #FF7300', borderRadius: '4px', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.7rem' }}>h</span>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                               setEditingHoursRowId(row.id);
                               setEditHoursValue(row.hours ?? 0);
                            }}
                            style={{ 
                              fontSize: '0.7rem', 
                              color: (row.hours || 0) < 40 ? '#ef4444' : '#22c55e', 
                              cursor: 'pointer', 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              gap: '2px',
                              marginLeft: '0.5rem',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              fontWeight: 800
                            }}
                            title="Clique para editar horas"
                          >
                            {row.hours !== undefined ? `${row.hours}h` : '0h'}
                            <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>✏️</span>
                          </div>
                        )}
                      </div>
                      <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setHiddenRows([...hiddenRows, row.id])}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
                          title="Ocultar Colaborador"
                        >
                          👁️‍🗨️
                        </button>
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             if (window.confirm(`⚠️ ELIMINAR PESSOA: Deseja apagar o registo de "${row.name}"?`)) {
                               onDeleteRow(project.id, row.id, store);
                             }
                           }}
                           style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
                           title="Eliminar Colaborador"
                         >
                          ×
                        </button>
                      </div>
                    </div>
                  </td>
                  {visibleColumns.map(col => {
                    const done = isCellDone(project.id, row.id, col, store);
                   return (
                     <td 
                       key={col} 
                       className={done ? 'done-cell' : ''}
                       onClick={() => onToggleCell(project.id, row.id, col)}
                       style={{ 
                         padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', 
                         cursor: 'pointer', backgroundColor: done ? '#dcfce7' : 'transparent',
                         transition: 'background-color 0.2s', fontSize: '1rem'
                       }}
                     >
                       {done ? (
                         <span style={{ color: '#166534', fontWeight: 900 }}>X</span>
                       ) : (
                         <span style={{ color: '#e2e8f0' }}>·</span>
                       )}
                     </td>
                   );
                 })}
               </tr>
              ))
            ) : (
              visibleColumns.map(col => (
                <tr key={col}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ flex: 1 }}>{col}</span>
                      <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setHiddenCols([...hiddenCols, col])}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
                          title="Ocultar Módulo"
                        >
                          👁️‍🗨️
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`⚠️ ELIMINAR MÓDULO: Deseja apagar o curso "${col}"?`)) {
                              onDeleteColumn(project.id, col);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
                          title="Eliminar Módulo"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </td>
                  {visibleRows.map(row => {
                    const done = isCellDone(project.id, row.id, col, store);
                    return (
                      <td 
                        key={row.id} 
                        className={done ? 'done-cell' : ''}
                        onClick={() => onToggleCell(project.id, row.id, col)}
                        style={{ 
                          padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', 
                          cursor: 'pointer', backgroundColor: done ? '#dcfce7' : 'transparent',
                          transition: 'background-color 0.2s', fontSize: '1rem'
                        }}
                      >
                        {done ? (
                          <span style={{ color: '#166534', fontWeight: 900 }}>X</span>
                        ) : (
                          <span style={{ color: '#e2e8f0' }}>·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
            
            {/* Empty States */}
            {((!isTransposed && visibleRows.length === 0) || (isTransposed && visibleColumns.length === 0)) && (
              <tr>
                <td colSpan={99} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                   Nesta loja ainda não tem itens adicionados ou estão todos ocultos.
                </td>
              </tr>
            )}
          </tbody>
       </table>
    </div>

    <div className="no-print" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      {/* Form para adicionar Colaborador */}
      <form onSubmit={handleAddRow} style={{ flex: 1, minWidth: '250px', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" value={newRowName} onChange={(e) => setNewRowName(e.target.value)}
          placeholder="Novo Colaborador..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
        />
        <input 
          type="number" value={newRowHours} onChange={(e) => setNewRowHours(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Horas"
          style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 0.75rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
          + Pessoa
        </button>
      </form>

      {/* Form para adicionar Módulo */}
      <form onSubmit={handleAddCol} style={{ flex: 1, minWidth: '250px', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)}
          placeholder="Novo Módulo de Formação..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 0.75rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
          + Módulo
        </button>
      </form>
    </div>

    <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
      {hiddenCols.length > 0 && (
        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Módulos Ocultos</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {hiddenCols.map(col => (
              <button 
                key={col} 
                onClick={() => setHiddenCols(hiddenCols.filter(c => c !== col))}
                style={{ 
                  padding: '0.2rem 0.6rem', background: '#e2e8f0', color: '#475569', 
                  border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                }}
              >
                + {col}
              </button>
            ))}
          </div>
        </div>
      )}

      {hiddenRows.length > 0 && (
        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#fdf2f8', borderRadius: '8px', border: '1px dashed #fbcfe8' }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#be185d', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Colaboradores Ocultos</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {hiddenRows.map(rowId => {
              const row = rows.find(r => r.id === rowId);
              return (
                <button 
                  key={rowId} 
                  onClick={() => setHiddenRows(hiddenRows.filter(id => id !== rowId))}
                  style={{ 
                    padding: '0.2rem 0.6rem', background: '#fce7f3', color: '#be185d', 
                    border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  + {row?.name || 'Vago'}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
