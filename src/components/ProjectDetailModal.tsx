'use client';

import { useState, useMemo } from 'react';
import { Project, ALL_STORES, Store, MatrixRow, PlannerEntry, MaintenanceIncident, MaintenanceTask, WorkspaceBlock, BlockType, ShoppingItem } from '@/types';
import { ProjectMatrixView } from './ProjectMatrixView';
import { ProjectPlannerView } from './ProjectPlannerView';
import { ProjectIncidentsView } from './ProjectIncidentsView';
import { ProjectMaintenanceView } from './ProjectMaintenanceView';
import { ProjectWorkspaceView } from './ProjectWorkspaceView';
import { ProjectShoppingView } from './ProjectShoppingView';
import * as XLSX from 'xlsx-js-style';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  initialStore: string;
  isTaskDone: (projectId: string, taskId: string, store: string) => boolean;
  isCellDone: (projectId: string, rowId: string, colId: string, store: string) => boolean;
  onToggleTask: (projectId: string, taskId: string, store: string) => void;
  onToggleCell: (projectId: string, rowId: string, colId: string, store: string) => void;
  onAddRow: (projectId: string, name: string, store: string, hours?: number) => void;
  onDeleteRow: (projectId: string, rowId: string, store: string) => void;
  onUpdateRowHours: (projectId: string, rowId: string, store: string, hours: number) => void;
  onDeleteColumn: (projectId: string, colName: string) => void;
  onAddColumn: (projectId: string, colName: string) => void;
  getStoreRows: (projectId: string, store: string) => MatrixRow[];
  onToggleTranspose: (projectId: string) => void;
  onUpdatePlannerEntries: (projectId: string, month: number, entries: PlannerEntry[]) => void;
  onUpdateProjectNotes: (projectId: string, notes: string) => void;
  onAddIncident: (projectId: string, incident: Omit<MaintenanceIncident, 'id'>) => void;
  onUpdateIncident: (projectId: string, incidentId: string, data: Partial<MaintenanceIncident>) => void;
  onDeleteIncident: (projectId: string, incidentId: string) => void;
  onSetIncidentBudget: (projectId: string, store: string, budget: number) => void;
  onAddMaintenanceTask: (projectId: string, task: Omit<MaintenanceTask, 'id'>, store: string) => void;
  onUpdateMaintenanceTask: (projectId: string, taskId: string, updates: Partial<MaintenanceTask>, store: string) => void;
  onDeleteMaintenanceTask: (projectId: string, taskId: string, store: string) => void;
  onAddWorkspaceBlock: (projectId: string, type: BlockType, title: string, store: string) => void;
  onUpdateWorkspaceBlock: (projectId: string, blockId: string, updates: Partial<WorkspaceBlock>, store: string) => void;
  onDeleteWorkspaceBlock: (projectId: string, blockId: string, store: string) => void;
  onToggleWorkspaceTask: (projectId: string, blockId: string, taskId: string, store: string) => void;
  getStoreWorkspaceBlocks: (projectId: string, store: string) => WorkspaceBlock[];
  onAddShoppingItem: (projectId: string, item: any) => void;
  onUpdateShoppingItem: (projectId: string, itemId: string, updates: any) => void;
  onDeleteShoppingItem: (projectId: string, itemId: string) => void;
}

export function ProjectDetailModal({
  isOpen, onClose, project, initialStore, isTaskDone, isCellDone, onToggleTask, onToggleCell, 
  onAddRow, onDeleteRow, onUpdateRowHours, onAddColumn, onDeleteColumn, getStoreRows, 
  onToggleTranspose, onUpdatePlannerEntries, onUpdateProjectNotes,
  onAddIncident, onUpdateIncident, onDeleteIncident, onSetIncidentBudget,
  onAddMaintenanceTask, onUpdateMaintenanceTask, onDeleteMaintenanceTask,
  onAddWorkspaceBlock, onUpdateWorkspaceBlock, onDeleteWorkspaceBlock, onToggleWorkspaceTask, getStoreWorkspaceBlocks,
  onAddShoppingItem, onUpdateShoppingItem, onDeleteShoppingItem
}: ProjectDetailModalProps) {
  const [selectedStore, setSelectedStore] = useState<string>(
    initialStore === 'Todas as Lojas' ? ALL_STORES[0] : initialStore
  );
  const [printScope, setPrintScope] = useState<'current' | 'all'>('current');

  const handlePrint = () => {
    if (project.type !== 'PLANNER') {
      window.print();
      return;
    }

    // For PLANNER projects, build a dedicated print window to avoid modal scroll clipping
    const MONTHS = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const MONTH_COLORS = [
      '#92400e', '#166534', '#1e40af', '#9d174d', '#9a3412', '#14532d',
      '#991b1b', '#7f1d1d', '#1e3a5f', '#5b21b6', '#0c4a6e', '#1f2d3d'
    ];

    const monthsHtml = MONTHS.map((monthName, idx) => {
      const entries: PlannerEntry[] = project.plannerData?.[idx] || [];
      const entriesHtml = entries.length > 0
        ? entries.map(e => `
            <div style="padding:0.4rem 0.6rem; background:#f8fafc; border-radius:4px; border-left:3px solid #cbd5e1; font-size:0.82rem; margin-bottom:0.35rem;">
              <strong>${e.name}</strong>
              <span style="color:#64748b;"> (${e.store})</span>
              <span style="color:#0284c7; font-weight:600;"> ${e.date}</span>
            </div>`).join('')
        : `<div style="color:#94a3b8; font-size:0.78rem; font-style:italic;">Sem agendamentos</div>`;

      return `
        <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; min-height:120px; display:flex; flex-direction:column; break-inside:avoid;">
          <div style="padding:0.5rem; text-align:center; font-weight:800; font-size:0.85rem; text-transform:uppercase; border-bottom:1px solid #e2e8f0; color:${MONTH_COLORS[idx]};">
            ${monthName}
          </div>
          <div style="padding:0.5rem; flex:1;">
            ${entriesHtml}
          </div>
        </div>`;
    }).join('');

    const notesText = project.projectNotes
      ? project.projectNotes.replace(/\n/g, '<br/>')
      : '<em style="color:#94a3b8;">Sem notas registadas.</em>';

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>${project.title} – Relatório Anual</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; padding: 1.5cm; font-size: 14px; }
    h1 { font-size: 1.4rem; font-weight: 900; }
    .subtitle { color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 2rem; }
    .notes-box { border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.9rem; line-height: 1.6; min-height: 80px; }
    .section-title { font-size: 1rem; font-weight: 800; margin-bottom: 0.75rem; border-bottom: 2px solid #0f172a; padding-bottom: 0.3rem; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; }
    .date { font-size: 0.8rem; color: #64748b; text-align: right; }
    @page { size: A4; margin: 1.5cm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📋 ${project.title}</h1>
      <div class="subtitle">Relatório Anual de Consultas Médicas</div>
    </div>
    <div class="date">
      <strong>${new Date().toLocaleDateString('pt-PT')}</strong><br/>
      Agenda de Coordenação Ibersol
    </div>
  </div>

  <div class="section-title">Agendamentos por Mês</div>
  <div class="grid">
    ${monthsHtml}
  </div>

  <div class="section-title">Notas e Agendamentos Futuros</div>
  <div class="notes-box">${notesText}</div>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 500);
  };

  const handleExportPlannerExcel = () => {
    if (!project.plannerData) return;

    const MONTHS = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Build flat data: Mês | Nome | Loja | Data
    const rows: string[][] = [['Mês', 'Colaborador', 'Loja', 'Data']];

    MONTHS.forEach((monthName, idx) => {
      const entries: PlannerEntry[] = project.plannerData?.[idx] || [];
      entries.forEach(entry => {
        rows.push([
          monthName,
          entry.name,
          entry.store,
          entry.date
        ]);
      });
    });

    if (rows.length === 1) {
      rows.push(['', 'Sem agendamentos registados', '', '']);
    }

    // Add notes section
    rows.push([]);
    rows.push(['NOTAS E AGENDAMENTOS FUTUROS', '', '', '']);
    rows.push([project.projectNotes || 'Sem notas registadas.', '', '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Styles
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const ref = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = worksheet[ref];
        if (!cell) continue;
        cell.s = {
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          }
        };
        if (R === 0) {
          cell.s.font = { bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.fill = { fgColor: { rgb: '0F172A' } };
        }
      }
    }

    worksheet['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 14 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultas Médicas');
    XLSX.writeFile(workbook, `Consultas_Medicas_${project.title}_${new Date().getFullYear()}.xlsx`);
  };

  const handleExportExcel = () => {
    if (!project.matrixConfig) return;

    const rows = getStoreRows(project.id, selectedStore);
    const columns = project.matrixConfig.columns;

    // Cabeçalho: Nome, Coluna1, Coluna2..., Total Horas
    const worksheetData = [
      ['Colaborador', ...columns, 'Total Horas']
    ];

    rows.forEach(row => {
      const rowData = [row.name];
      columns.forEach(col => {
        const done = isCellDone(project.id, row.id, col, selectedStore);
        rowData.push(done ? 'X' : '');
      });
      rowData.push(row.hours?.toString() || '0');
      worksheetData.push(rowData);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Aplicar estilos às células
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = worksheet[cell_ref];
        if (!cell) continue;

        // Estilo Base
        cell.s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "E2E8F0" } },
            bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
            left: { style: 'thin', color: { rgb: "E2E8F0" } },
            right: { style: 'thin', color: { rgb: "E2E8F0" } }
          }
        };

        // Estilo do Cabeçalho (Linha 0)
        if (R === 0) {
          cell.s.font = { bold: true };
          cell.s.fill = { fgColor: { rgb: "F1F5F9" } }; // Cinza Claro
        } 
        else {
          // Estilo dos Dados
          if (cell.v === 'X') {
            cell.s.fill = { fgColor: { rgb: "C6EFCE" } }; // Verde Claro
            cell.s.font = { color: { rgb: "006100" }, bold: true }; // Verde Escuro
          } 
          
          // Estilo das Horas (Última Coluna)
          if (C === range.e.c) {
            const h = Number(cell.v) || 0;
            if (h < 40) {
              cell.s.fill = { fgColor: { rgb: "FFC7CE" } }; // Vermelho Claro
              cell.s.font = { color: { rgb: "9C0006" }, bold: true }; // Vermelho Escuro
            } else {
              cell.s.fill = { fgColor: { rgb: "C6EFCE" } }; // Verde Claro
              cell.s.font = { color: { rgb: "006100" }, bold: true };
            }
          }
        }
      }
    }

    // Definir larguras de colunas
    worksheet['!cols'] = [
      { wch: 30 }, // Nome do Colaborador
      ...columns.map(() => ({ wch: 15 })),
      { wch: 12 }  // Horas
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedStore);

    // Gerar ficheiro
    XLSX.writeFile(workbook, `Relatorio_${project.title}_${selectedStore}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-root" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000,
      backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <style jsx global>{`
        @media print {
          .modal-root { 
            position: absolute !important; 
            background: white !important; 
            backdrop-filter: none !important; 
            padding: 0 !important;
            display: block !important;
          }
          .modal-root > div { 
            box-shadow: none !important; 
            border: none !important;
            border-radius: 0 !important;
            max-width: none !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            transform: none !important;
            animation: none !important;
          }
          .modal-scroll-area {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 1cm !important;
          }
          .modal-footer, .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>
      <div className="animate-scale-up" style={{
        backgroundColor: 'var(--bg-color)', width: '100%', maxWidth: '1200px', maxHeight: '95vh',
        borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Report Header (Print Only) */}
        <div className="report-header">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Agenda de Coordenação Ibersol</h1>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                 Relatório de Projeto: {printScope === 'all' ? 'Consolidado Regional' : `Unidade ${selectedStore}`}
               </p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ margin: 0, fontWeight: 700 }}>{new Date().toLocaleDateString()}</p>
               <p style={{ margin: 0, fontSize: '0.8rem' }}>Projeto: {project.title}</p>
             </div>
           </div>
        </div>

        {/* Header */}
        <div className="no-print" style={{ 
          padding: '1.5rem', borderBottom: '1px solid var(--border-color)', 
          background: 'var(--surface-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, backgroundColor: 'var(--accent-dark)', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                {project.area}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{project.title}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: '#f1f5f9', border: 'none', width: '40px', height: '40px', 
              borderRadius: '50%', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Store Switcher */}
        {project.type !== 'PLANNER' && (
          <div className="no-print" style={{ 
            padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
            display: 'flex', gap: '0.5rem', overflowX: 'auto'
          }}>
            {ALL_STORES.map(s => (
              <button
                key={s}
                onClick={() => setSelectedStore(s)}
                style={{
                  whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '999px', border: 'none',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  backgroundColor: selectedStore === s ? 'var(--accent-dark)' : 'transparent',
                  color: selectedStore === s ? 'var(--primary-color)' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="modal-scroll-area" style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {/* Main View */}
          <div className={(printScope === 'all' && project.type !== 'PLANNER' && project.type !== 'INCIDENTS' && project.type !== 'MAINTENANCE' && project.type !== 'SHOPPING') ? 'no-print' : ''}>
            {project.type !== 'INCIDENTS' && project.type !== 'MAINTENANCE' && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Gestão de Operação: {selectedStore}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  {project.type === 'MATRIX' 
                    ? 'Registo de progressão de formação por colaborador nesta unidade.' 
                    : project.type === 'PLANNER'
                      ? 'Agendamento anual consolidado de todas as unidades.'
                      : 'Checklist de tarefas e metas a atingir nesta unidade.'}
                </p>
              </div>
            )}

            {project.type === 'MATRIX' && (
              <ProjectMatrixView 
                project={project}
                store={selectedStore}
                rows={getStoreRows(project.id, selectedStore)}
                isCellDone={isCellDone}
                onToggleCell={(pId, rId, cId) => onToggleCell(pId, rId, cId, selectedStore)}
                onAddRow={onAddRow}
                onDeleteRow={onDeleteRow}
                onUpdateRowHours={onUpdateRowHours}
                onAddColumn={onAddColumn}
                onDeleteColumn={onDeleteColumn}
                onToggleTranspose={onToggleTranspose}
              />
            )}

            {project.type === 'PLANNER' && (
              <ProjectPlannerView 
                project={project}
                onUpdateEntries={onUpdatePlannerEntries}
                onUpdateNotes={onUpdateProjectNotes}
              />
            )}

            {project.type === 'INCIDENTS' && (
              <ProjectIncidentsView
                project={project}
                selectedStore={selectedStore}
                printScope={printScope}
                onAddIncident={onAddIncident}
                onUpdateIncident={onUpdateIncident}
                onDeleteIncident={onDeleteIncident}
                onSetBudget={onSetIncidentBudget}
              />
            )}

            {project.type === 'MAINTENANCE' && (
              <ProjectMaintenanceView
                project={project}
                selectedStore={selectedStore}
                printScope={printScope}
                onAddTask={(pId, task) => onAddMaintenanceTask(pId, task, selectedStore)}
                onUpdateTask={(pId, tId, updates) => onUpdateMaintenanceTask(pId, tId, updates, selectedStore)}
                onDeleteTask={(pId, tId) => onDeleteMaintenanceTask(pId, tId, selectedStore)}
              />
            )}

            {project.type === 'WORKSPACE' && (
              <ProjectWorkspaceView 
                project={project}
                blocks={getStoreWorkspaceBlocks(project.id, selectedStore)}
                onAddBlock={(type, title) => onAddWorkspaceBlock(project.id, type, title, selectedStore)}
                onUpdateBlock={(blockId, updates) => onUpdateWorkspaceBlock(project.id, blockId, updates, selectedStore)}
                onDeleteBlock={(blockId) => onDeleteWorkspaceBlock(project.id, blockId, selectedStore)}
                onToggleTask={(blockId, taskId) => onToggleWorkspaceTask(project.id, blockId, taskId, selectedStore)}
              />
            )}

            {project.type === 'SHOPPING' && (
              <ProjectShoppingView 
                project={project}
                selectedStore={selectedStore}
                printScope={printScope}
                onAddItem={onAddShoppingItem}
                onUpdateItem={onUpdateShoppingItem}
                onDeleteItem={onDeleteShoppingItem}
              />
            )}

            {project.type === 'CHECKLIST' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {project.tasks.map(task => {
                  const done = isTaskDone(project.id, task.id, selectedStore);
                  return (
                    <div key={task.id} style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', 
                      backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' 
                    }}>
                      <div 
                        onClick={() => onToggleTask(project.id, task.id, selectedStore)}
                        style={{ 
                          width: '1.5rem', height: '1.5rem', borderRadius: '6px', border: '2px solid #cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          backgroundColor: done ? 'var(--success-color)' : 'transparent',
                          borderColor: done ? 'var(--success-color)' : '#cbd5e1'
                        }}
                      >
                        {done && <span style={{ color: 'white', fontSize: '0.9rem' }}>✓</span>}
                      </div>
                      <span style={{ 
                        flex: 1, fontSize: '1.05rem', color: done ? '#94a3b8' : '#1e293b',
                        textDecoration: done ? 'line-through' : 'none', fontWeight: 600
                      }}>
                        {task.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Stores View (Print Only) */}
          {printScope === 'all' && (
            <div className="print-only-regional">
               {ALL_STORES.map(store => (
                 <div key={store} className="print-store-section" style={{ pageBreakAfter: 'always', marginBottom: '3rem' }}>
                    <div style={{ borderBottom: '2px solid var(--accent-dark)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Unidade: {store}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Agenda de Coordenação Ibersol</p>
                    </div>
                    {project.type === 'MATRIX' ? (
                      <ProjectMatrixView 
                        project={project}
                        store={store}
                        rows={getStoreRows(project.id, store)}
                        isCellDone={isCellDone}
                        onToggleCell={() => {}} // No-op for print
                        onAddRow={() => {}}
                        onDeleteRow={() => {}}
                        onUpdateRowHours={() => {}}
                        onAddColumn={() => {}}
                        onDeleteColumn={() => {}}
                        onToggleTranspose={() => {}}
                      />
                    ) : project.type === 'SHOPPING' ? (
                      <ProjectShoppingView
                        project={project}
                        selectedStore={store}
                        printScope="current"
                        onAddItem={() => {}}
                        onUpdateItem={() => {}}
                        onDeleteItem={() => {}}
                      />
                    ) : null}
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ 
          padding: '1.25rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Scope Selector */}
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.2rem', borderRadius: '0.75rem' }}>
              <button 
                onClick={() => setPrintScope('current')}
                style={{ 
                  padding: '0.4rem 1rem', borderRadius: '0.6rem', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  background: printScope === 'current' ? '#fff' : 'transparent',
                  boxShadow: printScope === 'current' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  color: printScope === 'current' ? '#1e293b' : '#64748b'
                }}
              >
                Unidade Atual
              </button>
              <button 
                onClick={() => setPrintScope('all')}
                style={{ 
                  padding: '0.4rem 1rem', borderRadius: '0.6rem', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  background: printScope === 'all' ? '#fff' : 'transparent',
                  boxShadow: printScope === 'all' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  color: printScope === 'all' ? '#1e293b' : '#64748b'
                }}
              >
                Todas as Unidades
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={handlePrint}
                style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>📄</span> Gera PDF
              </button>
              {project.type !== 'PLANNER' ? (
                <button 
                  onClick={handleExportExcel}
                  style={{ 
                    backgroundColor: 'var(--accent-dark)', color: 'var(--primary-color)', border: 'none', padding: '0.8rem 1.5rem',
                    borderRadius: '0.75rem', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📊</span> Exportar Excel
                </button>
              ) : (
                <button 
                  onClick={handleExportPlannerExcel}
                  style={{ 
                    backgroundColor: 'var(--accent-dark)', color: 'var(--primary-color)', border: 'none', padding: '0.8rem 1.5rem',
                    borderRadius: '0.75rem', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📊</span> Exportar Excel
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ padding: '0.75rem 2rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Concluir Edição
          </button>
        </div>
      </div>
    </div>
  );
}
