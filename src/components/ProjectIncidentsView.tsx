'use client';

import { useState } from 'react';
import { Project, MaintenanceIncident, ALL_STORES } from '@/types';
import * as XLSX from 'xlsx-js-style';

interface ProjectIncidentsViewProps {
  project: Project;
  onAddIncident: (projectId: string, incident: Omit<MaintenanceIncident, 'id'>) => void;
  onUpdateIncident: (projectId: string, incidentId: string, data: Partial<MaintenanceIncident>) => void;
  onDeleteIncident: (projectId: string, incidentId: string) => void;
  onSetBudget: (projectId: string, store: string, budget: number) => void;
  selectedStore: string;
  printScope: 'current' | 'all';
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function ProjectIncidentsView({ project, onAddIncident, onUpdateIncident, onDeleteIncident, onSetBudget, selectedStore, printScope }: ProjectIncidentsViewProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [addingFor, setAddingFor] = useState<string | null>(null); // store key
  const [newRow, setNewRow] = useState({ requestDate: '', approvalDate: '', description: '', costExVat: '' });
  const [editingCell, setEditingCell] = useState<{ incId: string; field: keyof MaintenanceIncident } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const yearMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const getIncidents = (store: string, ym: string): MaintenanceIncident[] => {
    return (project.incidentData || {})[`${store}||${ym}`] || [];
  };

  const getAllYearIncidents = (store: string): MaintenanceIncident[] => {
    const data = project.incidentData || {};
    return Object.entries(data)
      .filter(([key]) => key.startsWith(`${store}||${selectedYear}-`))
      .flatMap(([, list]) => list);
  };

  const budget = (store: string): number => (project.incidentBudgets || {})[store] || 0;
  const monthlyBudget = (store: string): number => budget(store) / 12;

  const handleAddRow = (store: string) => {
    if (!newRow.description.trim()) return;
    onAddIncident(project.id, {
      requestDate: newRow.requestDate,
      approvalDate: newRow.approvalDate,
      description: newRow.description,
      costExVat: parseFloat(newRow.costExVat) || 0,
      store,
      yearMonth,
    });
    setNewRow({ requestDate: '', approvalDate: '', description: '', costExVat: '' });
    setAddingFor(null);
  };

  const startEdit = (inc: MaintenanceIncident, field: keyof MaintenanceIncident) => {
    setEditingCell({ incId: inc.id, field });
    setCellValue(String((inc as any)[field] || ''));
  };

  const commitEdit = (inc: MaintenanceIncident) => {
    if (!editingCell) return;
    const val = editingCell.field === 'costExVat' ? parseFloat(cellValue) || 0 : cellValue;
    onUpdateIncident(project.id, inc.id, { [editingCell.field]: val });
    setEditingCell(null);
  };

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    ALL_STORES.forEach(store => {
      const incidents = getIncidents(store, yearMonth);
      const rows = [
        [store, 'Curativa'],
        ['Data Pedido', 'Data da Aprovação', 'Reparação', 'Custo s/IVA'],
        ...incidents.map(i => [fmtDate(i.requestDate), fmtDate(i.approvalDate), i.description, i.costExVat]),
        [],
        ['', '', 'Total do Mês', incidents.reduce((a, i) => a + i.costExVat, 0)],
        ['', '', 'Orç.', monthlyBudget(store)],
        ['', '', 'R/O', incidents.reduce((a, i) => a + i.costExVat, 0) - monthlyBudget(store)],
        [],
        ['', '', 'Acumulado Ano', getAllYearIncidents(store).reduce((a, i) => a + i.costExVat, 0)],
        ['', '', 'Orç. Anual', budget(store)],
        ['', '', 'R/O Anual', getAllYearIncidents(store).reduce((a, i) => a + i.costExVat, 0) - budget(store)],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 14 }, { wch: 17 }, { wch: 40 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, store.substring(0, 31));
    });
    XLSX.writeFile(wb, `Manutencao_${project.title}_${yearMonth}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); }}
          style={navBtn}
        >◀</button>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '160px', textAlign: 'center' }}>
          {MONTHS[selectedMonth]} {selectedYear}
        </span>
        <button
          onClick={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); }}
          style={navBtn}
        >▶</button>
        
        <button 
          onClick={() => setShowHidden(!showHidden)}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0',
            backgroundColor: showHidden ? 'var(--accent-dark)' : 'white',
            color: showHidden ? 'var(--primary-color)' : '#64748b',
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            marginLeft: '1rem'
          }}
          className="no-print"
        >
          {showHidden ? '👁️ Ver Ativos' : '🙈 Ver Ocultos'}
        </button>

        <button onClick={handleExcelExport} style={excelBtn} className="no-print">📊 Exportar Excel</button>
      </div>

      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
          {printScope === 'current' 
            ? `A visualizar incidentes apenas da unidade ${selectedStore}.` 
            : 'A visualizar relatório regional consolidado de todas as unidades.'}
        </p>
      </div>

      {/* One table per store */}
      {(printScope === 'current' ? [selectedStore] : ALL_STORES).map(store => {
        const rawIncidents = getIncidents(store, yearMonth);
        const incidents = rawIncidents.filter(i => showHidden || !i.isHidden);
        const totalMonth = incidents.reduce((a, i) => a + i.costExVat, 0);
        const budgMonth = monthlyBudget(store);
        const roMonth = totalMonth - budgMonth;
        const yearIncidents = getAllYearIncidents(store);
        const totalYear = yearIncidents.reduce((a, i) => a + i.costExVat, 0);
        const budgYear = budget(store);
        const roYear = totalYear - budgYear;

        return (
          <div key={store} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Store header */}
            <div style={{ background: '#1e293b', color: 'white', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{store} — Curativa</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Orç. Anual:</span>
                {editingBudget === store ? (
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    onBlur={() => { onSetBudget(project.id, store, parseFloat(budgetInput) || 0); setEditingBudget(null); }}
                    autoFocus
                    style={{ width: '80px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                  />
                ) : (
                  <span
                    onClick={() => { setEditingBudget(store); setBudgetInput(String(budget(store))); }}
                    style={{ cursor: 'pointer', fontWeight: 700, color: '#fbbf24', borderBottom: '1px dashed #fbbf24' }}
                    title="Clique para editar orçamento anual"
                  >
                    {budget(store).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={th}>Data Pedido</th>
                    <th style={th}>Data da Aprovação</th>
                    <th style={{ ...th, textAlign: 'left', width: '40%' }}>Reparação</th>
                    <th style={th}>Custo s/IVA</th>
                    <th style={{ ...th, width: '100px' }} className="no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc, idx) => (
                    <tr key={inc.id} style={{ 
                       background: idx % 2 === 0 ? '#fefefe' : '#f8fafc', 
                       borderBottom: '1px solid #f1f5f9',
                       opacity: inc.isHidden ? 0.4 : 1
                    }}>
                      <td style={td} onClick={() => startEdit(inc, 'requestDate')}>
                        {editingCell?.incId === inc.id && editingCell.field === 'requestDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(inc)} autoFocus style={inlineInput} />
                          : fmtDate(inc.requestDate) || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={td} onClick={() => startEdit(inc, 'approvalDate')}>
                        {editingCell?.incId === inc.id && editingCell.field === 'approvalDate'
                          ? <input type="date" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(inc)} autoFocus style={inlineInput} />
                          : fmtDate(inc.approvalDate) || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'left' }} onClick={() => startEdit(inc, 'description')}>
                        {editingCell?.incId === inc.id && editingCell.field === 'description'
                          ? <input value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(inc)} autoFocus style={{ ...inlineInput, width: '100%' }} />
                          : inc.description}
                      </td>
                      <td style={{ ...td, color: '#0284c7', fontWeight: 600 }} onClick={() => startEdit(inc, 'costExVat')}>
                        {editingCell?.incId === inc.id && editingCell.field === 'costExVat'
                          ? <input type="number" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(inc)} autoFocus style={{ ...inlineInput, width: '80px' }} />
                          : `${inc.costExVat.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €`}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }} className="no-print">
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                             onClick={() => onUpdateIncident(project.id, inc.id, { isHidden: !inc.isHidden })} 
                             title={inc.isHidden ? "Mostrar" : "Ocultar"}
                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
                          >
                             {inc.isHidden ? '👁️' : '🙈'}
                          </button>
                          <button 
                             onClick={() => { if (window.confirm(`Tem a certeza que deseja eliminar o incidente "${inc.description}"?`)) onDeleteIncident(project.id, inc.id); }} 
                             title="Remover definitivamente"
                             style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem', opacity: 0.5 }}
                          >
                             ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Add row form */}
                  {addingFor === store ? (
                    <tr className="no-print" style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
                      <td style={td}><input type="date" value={newRow.requestDate} onChange={e => setNewRow(r => ({ ...r, requestDate: e.target.value }))} style={inlineInput} /></td>
                      <td style={td}><input type="date" value={newRow.approvalDate} onChange={e => setNewRow(r => ({ ...r, approvalDate: e.target.value }))} style={inlineInput} /></td>
                      <td style={{ ...td, textAlign: 'left' }}><input placeholder="Descrição da reparação..." value={newRow.description} onChange={e => setNewRow(r => ({ ...r, description: e.target.value }))} style={{ ...inlineInput, width: '100%' }} /></td>
                      <td style={td}><input type="number" placeholder="0.00" value={newRow.costExVat} onChange={e => setNewRow(r => ({ ...r, costExVat: e.target.value }))} style={{ ...inlineInput, width: '80px' }} /></td>
                      <td style={{ ...td, textAlign: 'center', display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleAddRow(store)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                        <button onClick={() => setAddingFor(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                      </td>
                    </tr>
                  ) : null}

                  {/* Add button row */}
                  <tr className="no-print">
                    <td colSpan={5} style={{ padding: '0.4rem 0.75rem' }}>
                      <button
                        onClick={() => { setAddingFor(store); setNewRow({ requestDate: '', approvalDate: '', description: '', costExVat: '' }); }}
                        style={{ background: 'none', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '0.3rem 1rem', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}
                      >
                        + Adicionar Incidente
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem', borderTop: '2px solid #e2e8f0', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total do Mês</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <SummaryCell label="Total" value={totalMonth} />
                  <SummaryCell label="Orç." value={budgMonth} />
                  <SummaryCell label="R/O" value={roMonth} colored />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Acumulado Ano</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <SummaryCell label="Total" value={totalYear} />
                  <SummaryCell label="Orç." value={budgYear} />
                  <SummaryCell label="R/O" value={roYear} colored />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCell({ label, value, colored }: { label: string; value: number; colored?: boolean }) {
  const color = colored ? (value <= 0 ? '#16a34a' : '#dc2626') : '#1e293b';
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: '0.82rem', color }}>
        {value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

// Styles
const navBtn: React.CSSProperties = {
  background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '1rem'
};
const excelBtn: React.CSSProperties = {
  background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a',
  borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem'
};
const th: React.CSSProperties = {
  padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700,
  color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase'
};
const td: React.CSSProperties = {
  padding: '0.45rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer'
};
const inlineInput: React.CSSProperties = {
  padding: '0.2rem 0.4rem', border: '1px solid #3b82f6', borderRadius: '4px',
  fontSize: '0.78rem', outline: 'none', width: '110px'
};
