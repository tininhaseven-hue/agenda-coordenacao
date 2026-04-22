"use client";
// Heartbeat update to trigger Vercel auto-production build

import { useState, useMemo, useEffect } from 'react';
import { routines } from '@/data/routines';
import { useRoutines } from '@/hooks/useRoutines';
import { RoutineList } from '@/components/RoutineList';
import { ProgressCard } from '@/components/ProgressCard';
import { Calendar } from '@/components/Calendar';
import { CustomTaskList } from '@/components/CustomTaskList';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AccessGate } from '@/components/AccessGate';
import { ProjectManager } from '@/components/ProjectManager';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { useProjects } from '@/hooks/useProjects';
import { VisitsManager } from '@/components/VisitsManager';
import { Project, ALL_STORES, Store, MatrixRow, PlannerEntry, MaintenanceIncident, MaintenanceTask, WorkspaceBlock, BlockType, ShoppingItem, Area, Routine, CustomTask } from '@/types';
import { formatDateKey, isRoutineVisibleOn } from '@/utils/routineUtils';
import { exportTaskReportToExcel, ReportItem } from '@/utils/reportExportUtils';
import { PerformanceCockpit } from '@/components/PerformanceCockpit';

type MainTab = 'VISÃO ROTINAS' | 'VISÃO ÁREAS' | 'RELATÓRIOS' | 'PROJETOS' | 'VISITAS' | 'PERFORMANCE';
type LocalStoreOption = Store | 'Todas as Lojas';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Format para a key do LocalStorage garantindo a timezone correta localmente
  const realY = activeDate.getFullYear();
  const realM = String(activeDate.getMonth() + 1).padStart(2, '0');
  const realD = String(activeDate.getDate()).padStart(2, '0');
  const activeDateStr = `${realY}-${realM}-${realD}`;

  const { 
    routineDataByStore, 
    activeDays, 
    toggleRoutine, 
    updateRoutineNote, 
    updateRoutineChecklist,
    rescheduleRoutine, 
    isLoaded, 
    getProgress,
    customTasksByStore,
    addCustomTask,
    toggleCustomTask,
    updateCustomTask,
    deleteCustomTask,
    rescheduleCustomTask,
    activeCustomDays,
    overdueRoutinesByStore,
    updateRoutineExecution,
    hideRoutine
  } = useRoutines(activeDateStr);

  const [activeStore, setActiveStore] = useState<LocalStoreOption>('Todas as Lojas');

  const {
    projects,
    toggleTaskExecution,
    getProjectProgress,
    isTaskDone,
    addTaskToProject,
    removeTaskFromProject,
    deleteProject,
    updateMatrixCell,
    addMatrixRow,
    addMatrixColumn,
    deleteMatrixColumn,
    deleteMatrixRow,
    updateMatrixRowHours,
    isMatrixCellDone,
    getStoreMatrixRows,
    toggleMatrixTranspose,
    addProject,
    renameProject,
    updatePlannerEntries,
    updateProjectNotes,
    addIncident,
    updateIncident,
    deleteIncident,
    setIncidentBudget,
    addMaintenanceTask,
    updateMaintenanceTask,
    deleteMaintenanceTask,
    addWorkspaceBlock,
    updateWorkspaceBlock,
    deleteWorkspaceBlock,
    toggleWorkspaceTask,
    getStoreWorkspaceBlocks,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem
  } = useProjects(activeStore);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProjectForModal = projects.find(p => p.id === selectedProjectId);

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedOverdueDate, setSelectedOverdueDate] = useState<string | undefined>(undefined);
  const [editingCustomTask, setEditingCustomTask] = useState<{task: CustomTask, store: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('VISÃO ROTINAS');
  const [searchTerm, setSearchTerm] = useState('');

  
  // Estados para Relatórios Detalhados
  const [reportView, setReportView] = useState<'RESUMO' | 'DETALHADO'>('RESUMO');
  const [reportPeriod, setReportPeriod] = useState<'DIA' | 'SEMANA' | 'MÊS' | 'CUSTOM'>('DIA');
  const [reportStartDate, setReportStartDate] = useState(activeDateStr);
  const [reportEndDate, setReportEndDate] = useState(activeDateStr);
  
  // Sub-tabs
  const [activeRoutineTab, setActiveRoutineTab] = useState<'FREQUÊNCIA' | 'OUTRAS ROTINAS' | 'ACOMPANHAMENTO PRESENCIAL'>('FREQUÊNCIA');
  const [activeAreaTab, setActiveAreaTab] = useState<Area | string>('Gestão Operacional e Vendas');
  
  const normalizeString = (s: string | undefined | null) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const areas: Area[] = [
    'Gestão Operacional e Vendas', 
    'Recursos Humanos (Pessoas)', 
    'Qualidade, Higiene e Segurança (HACCP)', 
    'Manutenção', 
    'Resultados e Finanças'
  ];
  const isGlobalView = activeStore === 'Todas as Lojas';

  const generateReportItems = () => {
    if (typeof window === 'undefined') return [];
    const reportItems: ReportItem[] = [];
    const dateList: string[] = [];
    const curr = new Date(activeDateStr);
    if (reportPeriod === 'DIA') {
      dateList.push(activeDateStr);
    } else if (reportPeriod === 'SEMANA') {
      // De Segunda a Domingo da semana ativa
      const day = curr.getDay(); // 0 (Dom) a 6 (Sab)
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para Segunda
      for (let i = 0; i < 7; i++) {
        const d = new Date(curr);
        d.setDate(diff + i);
        dateList.push(formatDateKey(d));
      }
    } else if (reportPeriod === 'MÊS') {
      // Todo o mês ativo
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        dateList.push(formatDateKey(new Date(year, month, i)));
      }
    } else {
      // Período Customizado
      const start = new Date(reportStartDate);
      const end = new Date(reportEndDate);
      let loop = new Date(start);
      while (loop <= end) {
        dateList.push(formatDateKey(loop));
        loop.setDate(loop.getDate() + 1);
        if (dateList.length > 62) break; // Limite de 2 meses para segurança
      }
    }

    dateList.forEach(date => {
      if (date < '2026-04-13') return; // Início oficial dos relatórios pedido pela Ana
      const dateObj = new Date(date);

      if (activeStore === 'Todas as Lojas') {
        // VISÃO CONSOLIDADA: Agrupar tarefas iguais por todas as lojas
        // 1. Rotinas Fixas
        routines.forEach(r => {
          if (isRoutineVisibleOn(r, dateObj)) {
            let completedCount = 0;
            const notesMap = new Map<string, string[]>();
            
            ALL_STORES.forEach(s => {
              const rawData = localStorage.getItem(`routines_${date}_${s}`);
              const data = rawData ? JSON.parse(rawData) : {};
              const exec = data[r.id];
              if (exec?.isHidden) return; // Skip if hidden for this store
              if (exec?.completed) completedCount++;
              if (exec?.notes) {
                if (!notesMap.has(exec.notes)) notesMap.set(exec.notes, []);
                notesMap.get(exec.notes)!.push(s);
              }
            });

            const dedupedNotes = Array.from(notesMap.entries()).map(([note, stores]) => {
              if (stores.length === ALL_STORES.length) return note;
              return `${stores.join(', ')}: ${note}`;
            });

            let status = '';
            if (completedCount === ALL_STORES.length) status = 'CONCLUÍDO';
            else if (completedCount === 0) status = 'PENDENTE';
            else status = `EM CURSO (${completedCount}/${ALL_STORES.length})`;

            reportItems.push({
              id: r.id,
              isCustom: false,
              date,
              store: 'Todas as Lojas',
              category: r.category,
              area: r.area,
              task: r.title,
              status,
              notes: dedupedNotes.join(' | ')
            });
          }
        });

        // 2. Tarefas Extra (Custom)
        const customGroups: Record<string, { task: any, stores: string[], completed: number, notes: string[], notesMap?: Map<string, string[]> }> = {};
        
        ALL_STORES.forEach(s => {
          const raw = localStorage.getItem(`customTasks_${date}_${s}`);
          const tasks: any[] = raw ? JSON.parse(raw) : [];
          tasks.forEach(t => {
            if (!customGroups[t.id]) {
              customGroups[t.id] = { task: t, stores: [], completed: 0, notes: [] };
            }
            if (!customGroups[t.id].stores.includes(s)) {
              customGroups[t.id].stores.push(s);
            }
            if (t.isCompleted) customGroups[t.id].completed++;
            if (t.notes) {
              if (!customGroups[t.id].notesMap) customGroups[t.id].notesMap = new Map<string, string[]>();
              const nm = customGroups[t.id].notesMap!;
              if (!nm.has(t.notes)) nm.set(t.notes, []);
              nm.get(t.notes)!.push(s);
            }
          });
        });

        Object.values(customGroups).forEach(group => {
          const total = group.stores.length;
          let status = '';
          if (group.completed === total) status = 'CONCLUÍDO';
          else if (group.completed === 0) status = 'PENDENTE';
          else status = `EM CURSO (${group.completed}/${total})`;

          reportItems.push({
            id: group.task.id,
            isCustom: true,
            date,
            store: total === ALL_STORES.length ? 'Todas as Lojas' : `${total} Lojas`,
            category: 'EXTRA',
            area: group.task.area || 'Diversos',
            task: group.task.title,
            status,
            notes: (() => {
              const nm = group.notesMap;
              if (!nm) return '';
              return Array.from(nm.entries()).map(([note, stores]: any) => {
                if (stores.length === group.stores.length) return note;
                return `${stores.join(', ')}: ${note}`;
              }).join(' | ');
            })()
          });
        });

      } else {
        const rawRoutines = localStorage.getItem(`routines_${date}_${activeStore}`);
        const dayRoutineExecs = rawRoutines ? JSON.parse(rawRoutines) : {};
        
        routines.forEach(r => {
          if (isRoutineVisibleOn(r, dateObj)) {
            const exec = dayRoutineExecs[r.id];
            if (exec?.isHidden) return; // Skip hidden routines
            reportItems.push({
              id: r.id,
              isCustom: false,
              date,
              store: activeStore,
              category: r.category,
              area: r.area,
              task: r.title,
              status: exec?.completed ? 'CONCLUÍDO' : 'PENDENTE',
              notes: exec?.notes || ''
            });
          }
        });

        const rawCustom = localStorage.getItem(`customTasks_${date}_${activeStore}`);
        const dayCustomTasks: any[] = rawCustom ? JSON.parse(rawCustom) : [];
        
        dayCustomTasks.forEach(ct => {
           reportItems.push({
             id: ct.id,
             isCustom: true,
             date,
             store: activeStore as string,
             category: 'EXTRA',
             area: ct.area || 'Diversos',
             task: ct.title,
             status: ct.isCompleted ? 'CONCLUÍDO' : 'PENDENTE',
             notes: ct.notes || ''
           });
        });
      }
    });

    if (!searchTerm) return reportItems;
    const term = normalizeString(searchTerm);
    return reportItems.filter(item => 
      normalizeString(item.task).includes(term) || 
      normalizeString(item.notes || '').includes(term)
    );
  };

  const reportItems = useMemo(() => generateReportItems(), [
    activeDateStr, routineDataByStore, customTasksByStore, isLoaded, activeDays, activeCustomDays, reportPeriod, reportStartDate, reportEndDate, activeStore, searchTerm
  ]);

  if (!hasMounted || !isLoaded) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>A carregar Agenda...</div>;
  }

  const currentStoreRoutineData = isGlobalView ? {} : (routineDataByStore[activeStore] || {});

  const handleToggle = (id: string, dateOverride?: string, storeOverride?: string) => {
    toggleRoutine(id, storeOverride || activeStore, dateOverride);
  };

  const handleNoteChange = (id: string, notes: string, storeOverride?: string, dateOverride?: string) => {
    const targetStore = storeOverride || activeStore;
    updateRoutineNote(id, targetStore, notes, dateOverride);
  };

  const handleOpenDetail = (routine: Routine, overdueDate?: string) => {
    setEditingCustomTask(null);
    setSelectedOverdueDate(overdueDate);
    setSelectedRoutine(routine);
    setIsModalOpen(true);
  };

  const handleOpenCustomDetail = (task: CustomTask, store: string) => {
    setSelectedRoutine(null);
    setEditingCustomTask({ task, store });
    setIsModalOpen(true);
  };

  const handleUpdateCustomTaskItem = (id: string, store: string, updates: any) => {
    updateCustomTask(id, store, updates);
    if (editingCustomTask) {
        setEditingCustomTask({ task: { ...editingCustomTask.task, ...updates }, store });
    }
  };

  const handleReschedule = (id: string, fromDate: string, toDate: string, store: string) => {
    if (editingCustomTask) {
      rescheduleCustomTask(id, fromDate, toDate, store);
    } else {
      rescheduleRoutine(id, fromDate, toDate, store);
    }
  };

  const handleToggleCustom = (id: string, store: string) => {
    toggleCustomTask(id, store);
    if (editingCustomTask) {
        setEditingCustomTask({ ...editingCustomTask, task: { ...editingCustomTask.task, isCompleted: !editingCustomTask.task.isCompleted } });
    }
  };

  // Filtragem extra para tarefas restritas a dias da semana (ex: Quartas-feiras) ou datas específicas no dia SELECIONADO!
  const currentDayOfWeek = activeDate.getDay();
  const currentMonth = activeDate.getMonth() + 1;
  const currentDayOfMonth = activeDate.getDate();

  const visibleRoutines = routines.filter(r => {
    const isNaturallyOccurring = 
      (r.visibleSpecificDates && r.visibleSpecificDates.some(d => d.month === currentMonth && d.day === currentDayOfMonth)) ||
      (r.visibleMonth !== undefined && r.visibleDay !== undefined && r.visibleMonth === currentMonth && r.visibleDay === currentDayOfMonth) ||
      (r.visibleDay !== undefined && r.visibleMonth === undefined && r.visibleDay === currentDayOfMonth) ||
      (r.visibleMonth !== undefined && r.visibleDay === undefined && r.visibleMonth === currentMonth) ||
      ((!r.visibleSpecificDates && r.visibleMonth === undefined && r.visibleDay === undefined) && (!r.visibleDaysOfWeek || r.visibleDaysOfWeek.includes(currentDayOfWeek)));

    // Filtro de Reagendamento: Se para esta loja já tiver registo de que foi movida DAQUI
    const execution = currentStoreRoutineData[r.id];
    if (execution?.rescheduledTo) return false;

    return isNaturallyOccurring;
  });

  // Adicionar tarefas que foram reagendadas PARA hoje (que não estariam aqui naturalmente)
  const rescheduledHere = routines.filter(r => {
    const execution = currentStoreRoutineData[r.id];
    const isNaturallyOccurring = r.visibleSpecificDates?.some(d => d.month === currentMonth && d.day === currentDayOfMonth) ||
                                (r.visibleMonth === currentMonth && r.visibleDay === currentDayOfMonth) ||
                                (r.visibleDay === currentDayOfMonth && r.visibleMonth === undefined) ||
                                (r.visibleMonth === currentMonth && r.visibleDay === undefined) ||
                                (!r.visibleDaysOfWeek || r.visibleDaysOfWeek.includes(currentDayOfWeek));
    
    return execution?.isRescheduled && !isNaturallyOccurring;
  });

  const finalVisibleRoutines = [...visibleRoutines, ...rescheduledHere].filter(r => {
    if (!searchTerm) return true;
    const term = normalizeString(searchTerm);
    return normalizeString(r.title).includes(term) || (r.description && normalizeString(r.description).includes(term));
  });

  const getOverdueFor = (categoryOrArea: string, isArea = false) => {
     const list = isGlobalView ? (() => {
        const allStoresOverdueList = ALL_STORES.flatMap(s => overdueRoutinesByStore[s] || []);
        return Array.from(
          new Map(allStoresOverdueList.map(r => [`${r.id}_${r.originalDate}`, r])).values()
        );
     })() : (overdueRoutinesByStore[activeStore] || []);

     return list.filter(r => {
        const matchesTerm = !searchTerm || normalizeString(r.title).includes(normalizeString(searchTerm)) || (r.description && normalizeString(r.description).includes(normalizeString(searchTerm)));
        const matchesCategory = isArea ? r.area === categoryOrArea : r.category === categoryOrArea;
        return matchesTerm && matchesCategory;
     });
  };

  const currentRoutinesListProps = {
    routineData: currentStoreRoutineData,
    allRoutineData: routineDataByStore,
    isGlobalView,
    onToggle: handleToggle,
    onNoteChange: (id: string, notes: string, date?: string) => handleNoteChange(id, notes, undefined, date),
    onOpenDetail: (routine: Routine, overdueDate?: string) => handleOpenDetail(routine, overdueDate)
  };

  const handleReportRowClick = (item: ReportItem) => {
    if (item.isCustom) {
      let taskFound: any = null;
      let targetStoreForModal = item.store;

      if (item.store === 'Todas as Lojas' || item.store.includes('Lojas')) {
        for (const s of ALL_STORES) {
          const raw = localStorage.getItem(`customTasks_${item.date}_${s}`);
          if (raw) {
            const list = JSON.parse(raw);
            const found = list.find((t: any) => t.id === item.id);
            if (found) {
              taskFound = found;
              targetStoreForModal = 'Todas as Lojas';
              break;
            }
          }
        }
      } else {
        const rawCustom = localStorage.getItem(`customTasks_${item.date}_${item.store}`);
        const dayCustomTasks: any[] = rawCustom ? JSON.parse(rawCustom) : [];
        taskFound = dayCustomTasks.find(t => t.id === item.id);
      }

      if (taskFound) {
        handleOpenCustomDetail(taskFound, targetStoreForModal);
      }
    } else {
      const routine = routines.find(r => r.id === item.id);
      if (routine) {
        if (isGlobalView || activeStore !== item.store) {
          setActiveStore(item.store as Store);
        }
        handleOpenDetail(routine, item.date);
      }
    }
  };



  return (
    <AccessGate>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-20">
      {/* SELETOR MULTI-LOJA GLOBAL */}
      <div className="no-print" style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem',
          backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'
      }}>
        <label style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>SELECIONAR LOJA</label>
        <select 
          value={activeStore} 
          onChange={(e) => setActiveStore(e.target.value as LocalStoreOption)}
          style={{
            padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)',
            fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', width: '100%',
            backgroundColor: 'var(--surface-color)', outline: 'none'
          }}
        >
          <option value="Todas as Lojas">Todas as Lojas</option>
          <optgroup label="Lojas">
            {ALL_STORES.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </optgroup>
        </select>
      </div>



      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }} className="no-print">
        <div className="main-tabs-selector" style={{
          display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-color)', flex: 1
        }}>
          {['VISÃO ROTINAS', 'VISÃO ÁREAS', 'PROJETOS', 'VISITAS', 'PERFORMANCE', 'RELATÓRIOS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab as MainTab)}
              style={{
                padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: mainTab === tab ? 'var(--accent-dark)' : 'transparent', color: mainTab === tab ? 'var(--primary-color)' : '#64748b',
                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
                boxShadow: mainTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'PROJETOS' ? '📂 ' : ''}
              {tab === 'PERFORMANCE' ? '📈 ' : ''}
              {tab}
            </button>
          ))}
        </div>
        
      </div>

      {mainTab === 'VISÃO ROTINAS' && (
        <div className="animate-fade">
          <header className="mb-6 no-print">
            <h1 className="page-title">
              AGENDA v2.5 - TESTE <span style={{ fontSize: '0.6em', opacity: 0.8, marginLeft: '0.5rem', fontWeight: 600 }}>Ana Neves</span>
            </h1>
            <p className="page-subtitle">Gestão Diária de Rotinas</p>
          </header>
          <Calendar activeDate={activeDate} onSelectDate={setActiveDate} activeDays={activeDays} activeCustomDays={activeCustomDays} />
          
          {/* Ad-hoc Custom Tasks Injection */}
          <CustomTaskList 
             tasks={(isGlobalView 
                ? ALL_STORES.flatMap(s => (customTasksByStore[s] || []).map(t => ({store: s, task: t}))) 
                : (customTasksByStore[activeStore] || []).map(t => ({store: activeStore, task: t}))
             ).filter(item => {
                if (!searchTerm) return true;
                const term = normalizeString(searchTerm);
                return normalizeString(item.task.title).includes(term) || (item.task.notes && normalizeString(item.task.notes).includes(term));
             })}
             onAdd={(title, store, area, rec, days, dayM, date, end) => addCustomTask(title, store, area, rec, days, dayM, date, end)}
             onToggle={(id, store) => toggleCustomTask(id, store)}
             onUpdateNotes={(id, store, notes) => updateCustomTask(id, store, { notes })}
             onDelete={(id, store) => deleteCustomTask(id, store)}
             onOpenDetail={handleOpenCustomDetail}
             isGlobalView={isGlobalView}
             storeName={activeStore}
             allStores={ALL_STORES}
             allAreas={areas}
             activeDateStr={activeDateStr}
             searchTerm={searchTerm}
             onSearchChange={setSearchTerm}
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {['FREQUÊNCIA', 'OUTRAS ROTINAS', 'ACOMPANHAMENTO PRESENCIAL'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRoutineTab(tab as any)}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '9999px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  backgroundColor: activeRoutineTab === tab ? 'var(--primary-color)' : 'var(--surface-color)', color: activeRoutineTab === tab ? 'white' : 'var(--text-muted)',
                  boxShadow: activeRoutineTab === tab ? 'var(--shadow-md)' : 'none', border: `1px solid ${activeRoutineTab === tab ? 'var(--primary-color)' : 'var(--border-color)'}`,
                }}
              >
                {tab === 'FREQUÊNCIA' ? 'Rotinas Chave' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="group-section">
            <h2 className="group-title">{activeRoutineTab === 'FREQUÊNCIA' ? 'ROTINAS CHAVE' : activeRoutineTab.replace('_', ' ')}</h2>
            
            {activeRoutineTab === 'FREQUÊNCIA' && (
              <>
                <RoutineList title="Diária" routines={finalVisibleRoutines.filter(r => r.category === 'DIÁRIA')} overdueRoutines={getOverdueFor('DIÁRIA')} {...currentRoutinesListProps} />
                <RoutineList title="Semanal" routines={finalVisibleRoutines.filter(r => r.category === 'SEMANAL')} overdueRoutines={getOverdueFor('SEMANAL')} {...currentRoutinesListProps} />
                <RoutineList title="Mensal" routines={finalVisibleRoutines.filter(r => r.category === 'MENSAL')} overdueRoutines={getOverdueFor('MENSAL')} {...currentRoutinesListProps} />
                <RoutineList title="Anual" routines={finalVisibleRoutines.filter(r => r.category === 'ANUAL')} overdueRoutines={getOverdueFor('ANUAL')} {...currentRoutinesListProps} />
              </>
            )}

            {activeRoutineTab === 'OUTRAS ROTINAS' && (
              <>
                <RoutineList title="Pessoas" routines={finalVisibleRoutines.filter(r => r.category === 'PESSOAS')} overdueRoutines={getOverdueFor('PESSOAS')} {...currentRoutinesListProps} />
                <RoutineList title="Clientes" routines={finalVisibleRoutines.filter(r => r.category === 'CLIENTES')} overdueRoutines={getOverdueFor('CLIENTES')} {...currentRoutinesListProps} />
                <RoutineList title="Vendas" routines={finalVisibleRoutines.filter(r => r.category === 'VENDAS')} overdueRoutines={getOverdueFor('VENDAS')} {...currentRoutinesListProps} />
                <RoutineList title="Resultados" routines={finalVisibleRoutines.filter(r => r.category === 'RESULTADOS')} overdueRoutines={getOverdueFor('RESULTADOS')} {...currentRoutinesListProps} />
              </>
            )}

            {activeRoutineTab === 'ACOMPANHAMENTO PRESENCIAL' && (
              <>
                <RoutineList title="Estruturado/Anunciado" routines={finalVisibleRoutines.filter(r => r.category === 'ESTRUTURADO/ANUNCIADO')} overdueRoutines={getOverdueFor('ESTRUTURADO/ANUNCIADO')} {...currentRoutinesListProps} />
                <RoutineList title="Curta Duração/ Não Anunciado" routines={finalVisibleRoutines.filter(r => r.category === 'CURTA DURAÇÃO/ NÃO ANUNCIADO')} overdueRoutines={getOverdueFor('CURTA DURAÇÃO/ NÃO ANUNCIADO')} {...currentRoutinesListProps} />
              </>
            )}
          </div>
        </div>
      )}

      {mainTab === 'VISÃO ÁREAS' && (
        <div className="animate-fade">
          <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Efetua a filtragem de tarefas correspondentes a uma única divisão.</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap', paddingBottom: '0.5rem' }}>
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setActiveAreaTab(area)}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  backgroundColor: activeAreaTab === area ? 'var(--primary-color)' : 'var(--surface-color)', color: activeAreaTab === area ? 'white' : 'var(--text-main)',
                  boxShadow: activeAreaTab === area ? 'var(--shadow-md)' : 'var(--shadow-sm)', border: `1px solid ${activeAreaTab === area ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  flexGrow: 1, textAlign: 'center'
                }}
              >
                {area}
              </button>
            ))}
          </div>

          <div className="group-section">
            <h2 className="group-title" style={{ fontSize: '1.25rem' }}>{activeAreaTab.toUpperCase()}</h2>
            <RoutineList title="Ações da Seleção" routines={finalVisibleRoutines.filter(r => r.area === activeAreaTab)} {...currentRoutinesListProps} />
          </div>

          {/* Inserção de Projetos na Visão de Áreas */}
          <div className="group-section animate-fade" style={{ marginTop: '2rem' }}>
            <h2 className="group-title" style={{ fontSize: '1.25rem', color: '#1e293b' }}>PROJETOS EM CURSO ({activeAreaTab.toUpperCase()})</h2>
            <div className="project-list" style={{ marginTop: '1rem' }}>
              {projects.filter(p => p.area === activeAreaTab && (!searchTerm || normalizeString(p.title).includes(normalizeString(searchTerm)))).map(project => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  store={activeStore}
                  isGlobalView={isGlobalView}
                  allStores={ALL_STORES}
                  getProgress={getProjectProgress}
                  isTaskDone={isTaskDone}
                  isCellDone={isMatrixCellDone}
                  onOpenDetail={(p: Project) => setSelectedProjectId(p.id)}
                  onDeleteProject={deleteProject}
                  onRenameProject={renameProject}
                  getStoreRows={getStoreMatrixRows}
                  getStoreWorkspaceBlocks={getStoreWorkspaceBlocks}
                />
              ))}
              {projects.filter(p => p.area === activeAreaTab && (!searchTerm || normalizeString(p.title).includes(normalizeString(searchTerm)))).length === 0 && (
                <p style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Nenhum projeto ativo para este departamento.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'PROJETOS' && (
         <div className="animate-fade">
           <ProjectManager 
            activeStore={activeStore} 
            allAreas={areas as any} 
            isGlobalView={isGlobalView} 
            allStores={ALL_STORES}
            getProgress={getProjectProgress}
            isTaskDone={isTaskDone}
            isCellDone={isMatrixCellDone}
            onOpenDetail={(p: Project) => setSelectedProjectId(p.id)}
            onDeleteProject={deleteProject}
            addProject={addProject}
            projects={projects.filter(p => !searchTerm || normalizeString(p.title).includes(normalizeString(searchTerm)))}
            onRenameProject={renameProject}
            getStoreRows={getStoreMatrixRows}
            getStoreWorkspaceBlocks={getStoreWorkspaceBlocks}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
         </div>
       )}

       {selectedProjectForModal && (
         <ProjectDetailModal 
           isOpen={!!selectedProjectForModal}
           onClose={() => setSelectedProjectId(null)}
           project={selectedProjectForModal}
           initialStore={activeStore}
           isTaskDone={isTaskDone}
           isCellDone={isMatrixCellDone}
           onToggleTask={toggleTaskExecution}
           onToggleCell={updateMatrixCell}
           onAddRow={addMatrixRow}
           onDeleteRow={deleteMatrixRow}
           onUpdateRowHours={updateMatrixRowHours}
           onAddColumn={addMatrixColumn}
           onDeleteColumn={deleteMatrixColumn}
           getStoreRows={getStoreMatrixRows}
           onToggleTranspose={toggleMatrixTranspose}
            onUpdatePlannerEntries={updatePlannerEntries}
            onUpdateProjectNotes={updateProjectNotes}
            onAddIncident={addIncident}
            onUpdateIncident={updateIncident}
            onDeleteIncident={deleteIncident}
            onSetIncidentBudget={setIncidentBudget}
            onAddMaintenanceTask={addMaintenanceTask}
            onUpdateMaintenanceTask={updateMaintenanceTask}
            onDeleteMaintenanceTask={deleteMaintenanceTask}
            onAddWorkspaceBlock={addWorkspaceBlock}
            onUpdateWorkspaceBlock={updateWorkspaceBlock}
            onDeleteWorkspaceBlock={deleteWorkspaceBlock}
            onToggleWorkspaceTask={toggleWorkspaceTask}
            getStoreWorkspaceBlocks={getStoreWorkspaceBlocks}
            onAddShoppingItem={addShoppingItem}
            onUpdateShoppingItem={updateShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
         />
       )}

      {mainTab === 'VISITAS' && (
        <div className="animate-fade">
          <VisitsManager activeStore={activeStore} />
        </div>
      )}

      {mainTab === 'PERFORMANCE' && (
        <div className="animate-fade">
          <PerformanceCockpit />
        </div>
      )}

      {mainTab === 'RELATÓRIOS' && (
        <div className="animate-fade">
          <div className="no-print">
            <CustomTaskList 
              tasks={[]} // Empty array since we are hiding the list anyway
              onAdd={(title, store, area, rec, days, dayM, date) => addCustomTask(title, store, area, rec, days, dayM, date)}
              onToggle={() => {}}
              onUpdateNotes={() => {}}
              onDelete={() => {}}
              isGlobalView={isGlobalView}
              storeName={activeStore}
              allStores={ALL_STORES}
              allAreas={areas}
              activeDateStr={activeDateStr}
              hideList={true}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="group-title" style={{ margin: 0 }}>Gestão de Eficiência e Auditoria</h2>
            <button 
              onClick={() => setReportView(reportView === 'RESUMO' ? 'DETALHADO' : 'RESUMO')}
              style={{
                padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)',
                backgroundColor: 'white', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)'
              }}
            >
              {reportView === 'RESUMO' ? '📊 Ver Detalhe de Tarefas' : '📈 Ver Eficiência Geral'}
            </button>
          </div>

          {reportView === 'RESUMO' ? (
            <>
              <p className="page-subtitle">Visualização de nível de execução preenchido em tempo real para {activeStore}.</p>
              <div className="grid-cols-2">
                {areas.map(area => {
                  const areaRoutines = finalVisibleRoutines.filter(r => r.area === area);
                  let completedInArea = 0;
                  let maxTasks = 0;

                  if (isGlobalView) {
                    maxTasks = areaRoutines.length * ALL_STORES.length;
                    areaRoutines.forEach(r => {
                      ALL_STORES.forEach(s => {
                        if (routineDataByStore[s]?.[r.id]?.completed) completedInArea++;
                      });
                    });
                  } else {
                    maxTasks = areaRoutines.length;
                    completedInArea = areaRoutines.filter(r => currentStoreRoutineData[r.id]?.completed).length;
                  }

                  const percentage = getProgress(maxTasks, completedInArea);
                  return (
                    <ProgressCard 
                      key={area} 
                      label={area} 
                      percentage={percentage} 
                      onClick={() => {
                        setActiveAreaTab(area);
                        setMainTab('VISÃO ÁREAS');
                      }}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="animate-fade detailed-report-section">
              <div style={{ 
                backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '1rem', 
                border: '1px solid var(--border-color)', marginBottom: '1.5rem',
                display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center'
              }} className="no-print">
                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['DIA', 'SEMANA', 'MÊS', 'CUSTOM'].map(p => (
                      <button 
                         key={p} 
                         onClick={() => setReportPeriod(p as any)}
                         style={{
                           padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                           backgroundColor: reportPeriod === p ? 'var(--primary-color)' : 'white',
                           color: reportPeriod === p ? 'white' : 'var(--text-muted)',
                           fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer'
                         }}
                      >
                        {p === 'CUSTOM' ? 'PERSONALIZADO' : p}
                      </button>
                    ))}
                 </div>

                 {reportPeriod === 'CUSTOM' && (
                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="date" 
                        value={reportStartDate} 
                        onChange={(e) => setReportStartDate(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>até</span>
                      <input 
                        type="date" 
                        value={reportEndDate} 
                        onChange={(e) => setReportEndDate(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                      />
                   </div>
                 )}
                 
                 <div style={{ flex: 1 }} />

                 <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => {
                        const data = generateReportItems();
                        exportTaskReportToExcel(data, `${reportPeriod} - ${activeStore} - ${activeDateStr}`);
                      }}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '0.75rem', border: 'none',
                        backgroundColor: '#10b981', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      📥 Exportar Excel
                    </button>
                    <button 
                      onClick={() => window.print()}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '0.75rem', border: 'none',
                        backgroundColor: '#3b82f6', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      🖨️ Imprimir
                    </button>
                 </div>
              </div>

              <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 800, color: '#475569' }}>DATA</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 800, color: '#475569' }}>LOJA</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 800, color: '#475569' }}>TAREFA</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#475569' }}>ESTADO</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 800, color: '#475569' }}>NOTAS</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#475569' }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateReportItems().map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => handleReportRowClick(item)}
                        className="report-row"
                        style={{ 
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td style={{ padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>{item.date}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{item.store}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.task}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{item.category} • {item.area}</div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900,
                            backgroundColor: item.status === 'CONCLUÍDO' ? '#dcfce7' : '#fee2e2',
                            color: item.status === 'CONCLUÍDO' ? '#166534' : '#991b1b'
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontStyle: item.notes ? 'normal' : 'italic', color: item.notes ? 'var(--text-main)' : '#cbd5e1' }}>
                          <span dangerouslySetInnerHTML={{ __html: item.notes || 'Sem observações' }} />
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Deseja eliminar/ocultar esta tarefa deste relatório?')) {
                                if (item.isCustom) {
                                  deleteCustomTask(item.id, isGlobalView ? 'Todas as Lojas' : item.store, item.date);
                                } else {
                                  hideRoutine(item.id, isGlobalView ? 'Todas as Lojas' : item.store, item.date);
                                }
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1.1rem' }}
                            title="Eliminar tarefa"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {generateReportItems().length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                          Nenhum dado encontrado para o período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {(selectedRoutine || editingCustomTask) && (
        <TaskDetailModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          routine={selectedRoutine || {
            id: editingCustomTask!.task.id,
            title: editingCustomTask!.task.title,
            area: editingCustomTask!.task.area || 'Gestão Operacional e Vendas',
            category: 'DIÁRIA', // Placeholder for modal type
            group: 'FREQUÊNCIA'
          } as Routine}
          execution={selectedRoutine 
            ? (selectedOverdueDate 
                ? (routineDataByStore[activeStore]?.[selectedRoutine.id] || { completed: false, notes: '' }) 
                : currentStoreRoutineData[selectedRoutine.id])
            : { completed: editingCustomTask!.task.isCompleted, notes: editingCustomTask!.task.notes }
          }
          storeName={editingCustomTask ? editingCustomTask.store : activeStore}
          onToggle={selectedRoutine ? ((id, store) => handleToggle(id, selectedOverdueDate, store)) : handleToggleCustom}
          onUpdateNotes={((id, store, notes) => handleNoteChange(id, notes, store, selectedOverdueDate))}
          onReschedule={handleReschedule}
          activeDateStr={selectedOverdueDate || activeDateStr}
          isCustomTask={!!editingCustomTask}
          onUpdateTask={handleUpdateCustomTaskItem}
          onUpdateChecklist={updateRoutineChecklist}
          onDelete={deleteCustomTask}
          onUpdateExecution={updateRoutineExecution}
          availableAreas={areas}
          allRoutineExecutions={routineDataByStore}
          allCustomExecutions={customTasksByStore}
        />
      )}
      </div>
    </AccessGate>
  );
}
