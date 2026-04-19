'use client';

import { useState } from 'react';
import { Project, MaintenanceTask, ALL_STORES } from '@/types';
import * as XLSX from 'xlsx-js-style';

interface ProjectMaintenanceViewProps {
  project: Project;
  onAddTask: (projectId: string, task: Omit<MaintenanceTask, 'id'>) => void;
  onUpdateTask: (projectId: string, taskId: string, updates: Partial<MaintenanceTask>) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  selectedStore: string;
  printScope: 'current' | 'all';
}

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function ProjectMaintenanceView({ project, onAddTask, onUpdateTask, onDeleteTask, selectedStore, printScope }: ProjectMaintenanceViewProps) {
  const [addingFor, setAddingFor] = useState<string | null>(null); // store name
  const [newTask, setNewTask] = useState<Omit<MaintenanceTask, 'id' | 'store'>>({
    problem: '',
    entryDate: new Date().toISOString().split('T')[0],
    measure: '',
    incidentNo: '',
    incidentDate: '',
    resolutionDate: '',
    validationDate: '',
    amountPaid: 0
  });

  const [editingCell, setEditingCell] = useState<{ taskId: string; field: keyof MaintenanceTask } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const handleAddTask = (store: string) => {
    if (!newTask.problem.trim()) return;
    onAddTask(project.id, { ...newTask, store });
    setNewTask({
      problem: '',
      entryDate: new Date().toISOString().split('T')[0],
      measure: '',
      incidentNo: '',
      incidentDate: '',
      resolutionDate: '',
      validationDate: '',
      amountPaid: 0
    });
    setAddingFor(null);
  };

  const startEdit = (task: MaintenanceTask, field: keyof MaintenanceTask) => {
    setEditingCell({ taskId: task.id, field });
    setCellValue(String((task as any)[field] || ''));
  };

  const commitEdit = (task: MaintenanceTask) => {
    if (!editingCell) return;
    const val = editingCell.field === 'amountPaid' ? parseFloat(cellValue) || 0 : cellValue;
    onUpdateTask(project.id, task.id, { [editingCell.field]: val });
    setEditingCell(null);
  };

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    ALL_STORES.forEach(store => {
      const tasks = (project.maintenanceData || {})[store] || [];
      const rows = [
        [store, 'Manutenções Necessárias'],
        ['Problema', 'Data', 'Medida', 'Incidente nº', 'Data Incidente', 'Data Resolução', 'Data Validação', 'Valor Pago'],
        ...tasks.map(t => [
          t.problem, 
          fmtDate(t.entryDate), 
          t.measure, 
          t.incidentNo, 
          fmtDate(t.incidentDate), 
          fmtDate(t.resolutionDate), 
          fmtDate(t.validationDate), 
          t.amountPaid
        ]),
        [],
        ['', '', '', '', '', '', 'TOTAL', tasks.reduce((acc, t) => acc + t.amountPaid, 0)]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, store.substring(0, 31));
    });
    XLSX.writeFile(wb, `Manutencoes_Necessarias_${project.title}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Rastreador de Manutenções</h2>
          <button 
            onClick={() => setShowHidden(!showHidden)}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: showHidden ? 'var(--accent-dark)' : 'white',
              color: showHidden ? 'var(--primary-color)' : '#64748b',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {showHidden ? '👁️ Ver Ativos' : '🙈 Ver Ocultos'}
          </button>
        </div>
        <button onClick={handleExcelExport} style={excelBtn}>📊 Exportar Histórico Excel</button>
      </div>

      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
          {printScope === 'current' 
            ? `A visualizar manutenções apenas da unidade ${selectedStore}.` 
            : 'A visualizar relatório regional consolidado de todas as unidades.'}
        </p>
      </div>

      {(printScope === 'current' ? [selectedStore] : ALL_STORES).map(store => {
        const rawTasks = (project.maintenanceData || {})[store] || [];
        const tasks = rawTasks.filter(t => showHidden || !t.isHidden);
        const totalPaid = tasks.reduce((acc, t) => acc + t.amountPaid, 0);

        return (
          <div key={store} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#334155', color: 'white', padding: '0.75rem 1.25rem', fontWeight: 800, fontSize: '0.9rem' }}>
              📍 {store}
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ ...th, textAlign: 'left', width: '20%' }}>Problema</th>
                    <th style={th}>Data</th>
                    <th style={{ ...th, textAlign: 'left', width: '20%' }}>Medida</th>
                    <th style={th}>Incidente nº</th>
                    <th style={th}>Data Incid.</th>
                    <th style={th}>Data Resol.</th>
                    <th style={th}>Data Valid.</th>
                    <th style={th}>Valor Pago</th>
                    <th style={{ ...th, width: '100px' }} className="no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => (
                    <tr key={task.id} style={{ 
                       background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', 
                       borderBottom: '1px solid #f1f5f9',
                       opacity: task.isHidden ? 0.4 : 1
                    }}>
                      <td style={{ ...td, textAlign: 'left' }} onClick={() => startEdit(task, 'problem')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'problem'
                          ? <input value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={{ ...inlineInput, width: '100%' }} />
                          : <strong>{task.problem}</strong>}
                      </td>
                      <td style={td} onClick={() => startEdit(task, 'entryDate')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'entryDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={inlineInput} />
                          : fmtDate(task.entryDate)}
                      </td>
                      <td style={{ ...td, textAlign: 'left' }} onClick={() => startEdit(task, 'measure')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'measure'
                          ? <input value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={{ ...inlineInput, width: '100%' }} />
                          : task.measure || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={td} onClick={() => startEdit(task, 'incidentNo')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'incidentNo'
                          ? <input value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={inlineInput} />
                          : task.incidentNo || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={td} onClick={() => startEdit(task, 'incidentDate')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'incidentDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={inlineInput} />
                          : fmtDate(task.incidentDate) || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={td} onClick={() => startEdit(task, 'resolutionDate')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'resolutionDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={inlineInput} />
                          : fmtDate(task.resolutionDate) || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={td} onClick={() => startEdit(task, 'validationDate')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'validationDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={inlineInput} />
                          : fmtDate(task.validationDate) || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: '#0369a1' }} onClick={() => startEdit(task, 'amountPaid')}>
                        {editingCell?.taskId === task.id && editingCell.field === 'amountPaid'
                          ? <input type="number" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(task)} autoFocus style={{ ...inlineInput, width: '70px' }} />
                          : `${task.amountPaid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }} className="no-print">
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                             onClick={() => onUpdateTask(project.id, task.id, { isHidden: !task.isHidden })} 
                             title={task.isHidden ? "Mostrar" : "Ocultar"}
                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
                          >
                             {task.isHidden ? '👁️' : '🙈'}
                          </button>
                          <button 
                             onClick={() => { if(confirm('Eliminar esta linha?')) onDeleteTask(project.id, task.id); }} 
                             title="Remover definitivamente"
                             style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.5 }}
                          >
                             ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Add row form */}
                  {addingFor === store ? (
                    <tr className="no-print" style={{ background: '#f0fdf4' }}>
                      <td style={td}>
                        <input 
                          placeholder="Novo problema..." 
                          value={newTask.problem} 
                          onChange={e => setNewTask(v => ({ ...v, problem: e.target.value }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddTask(store)}
                          style={{ ...inlineInput, width: '100%' }} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="date" 
                          value={newTask.entryDate} 
                          onChange={e => setNewTask(v => ({ ...v, entryDate: e.target.value }))} 
                          style={inlineInput} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          placeholder="Medida..." 
                          value={newTask.measure} 
                          onChange={e => setNewTask(v => ({ ...v, measure: e.target.value }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddTask(store)}
                          style={{ ...inlineInput, width: '100%' }} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          placeholder="Nº (Opcional)" 
                          value={newTask.incidentNo} 
                          onChange={e => setNewTask(v => ({ ...v, incidentNo: e.target.value }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddTask(store)}
                          style={inlineInput} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="date" 
                          value={newTask.incidentDate} 
                          onChange={e => setNewTask(v => ({ ...v, incidentDate: e.target.value }))} 
                          style={inlineInput} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="date" 
                          value={newTask.resolutionDate} 
                          onChange={e => setNewTask(v => ({ ...v, resolutionDate: e.target.value }))} 
                          style={inlineInput} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="date" 
                          value={newTask.validationDate} 
                          onChange={e => setNewTask(v => ({ ...v, validationDate: e.target.value }))} 
                          style={inlineInput} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={newTask.amountPaid || ''} 
                          onChange={e => setNewTask(v => ({ ...v, amountPaid: parseFloat(e.target.value) || 0 }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddTask(store)}
                          style={{ ...inlineInput, width: '70px' }} 
                        />
                      </td>
                      <td style={{ ...td, display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleAddTask(store)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setAddingFor(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ) : null}

                  {/* Add button */}
                  <tr className="no-print">
                    <td colSpan={9} style={{ padding: '0.5rem 1rem' }}>
                      <button
                        onClick={() => setAddingFor(store)}
                        style={{ width: '100%', background: 'none', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.4rem', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        + Adicionar Registo de Manutenção
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Total */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
               <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Valor Total Pago ({store})</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                    {totalPaid.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </div>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Styles
const excelBtn: React.CSSProperties = {
  background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a',
  borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem'
};
const th: React.CSSProperties = {
  padding: '0.75rem', textAlign: 'center', fontWeight: 700,
  color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase'
};
const td: React.CSSProperties = {
  padding: '0.6rem 0.75rem', textAlign: 'center', verticalAlign: 'middle'
};
const inlineInput: React.CSSProperties = {
  padding: '0.2rem 0.4rem', border: '1px solid #3b82f6', borderRadius: '4px',
  fontSize: '0.75rem', outline: 'none', width: '90px'
};
