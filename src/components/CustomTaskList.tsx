import React, { useState, useEffect } from 'react';
import { CustomTask, Area } from '@/types';

export interface ExtendedCustomTask {
  store: string;
  task: CustomTask;
}

interface CustomTaskListProps {
  tasks: ExtendedCustomTask[];
  onAdd: (title: string, store: string, area?: Area, recurrence?: any, daysOfWeek?: number[], dayOfMonth?: number, startDate?: string, endDate?: string) => void;
  onToggle: (id: string, store: string) => void;
  onUpdateNotes: (id: string, store: string, notes: string) => void;
  onDelete: (id: string, store: string) => void;
  isGlobalView: boolean;
  storeName: string;
  allStores: readonly string[];
  allAreas: Area[];
  onOpenDetail?: (task: CustomTask, store: string) => void;
  activeDateStr: string;
  hideList?: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function CustomTaskList({ 
  tasks, onAdd, onToggle, onUpdateNotes, onDelete, isGlobalView, storeName, allStores, allAreas, onOpenDetail, activeDateStr, hideList = false,
  searchTerm, onSearchChange 
}: CustomTaskListProps) {
  const [inputValue, setInputValue] = useState('');
  const [targetStore, setTargetStore] = useState(storeName === 'Todas as Lojas' ? '' : storeName);
  const [targetArea, setTargetArea] = useState<Area | ''>('');
  const [recurrence, setRecurrence] = useState<any>('NONE');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [targetDate, setTargetDate] = useState(activeDateStr);
  const [targetEndDate, setTargetEndDate] = useState(activeDateStr);

  const daysLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  useEffect(() => {
    if (storeName !== 'Todas as Lojas') {
      setTargetStore(storeName);
    } else {
      setTargetStore('Todas as Lojas');
    }
  }, [storeName]);

  useEffect(() => {
    setTargetDate(activeDateStr);
    setTargetEndDate(activeDateStr);
  }, [activeDateStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && targetStore && targetArea) {
      onAdd(
        inputValue.trim(), 
        targetStore, 
        targetArea as Area, 
        recurrence, 
        recurrence === 'WEEKLY' ? selectedDays : undefined,
        (recurrence === 'MONTHLY' || recurrence === 'ANNUAL') ? dayOfMonth : undefined,
        targetDate,
        targetEndDate !== targetDate ? targetEndDate : undefined
      );
      setInputValue('');
      setRecurrence('NONE');
      setSelectedDays([]);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Group tasks by id so we don't render them 7 times in global view
  const groupedTasks: { task: CustomTask, stores: string[] }[] = [];
  tasks.forEach(t => {
    const existing = groupedTasks.find(g => g.task.id === t.task.id);
    if (existing) {
      if (!existing.stores.includes(t.store)) existing.stores.push(t.store);
    } else {
      groupedTasks.push({ task: t.task, stores: [t.store] });
    }
  });

  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Notas e Tarefas Extra</span>
      </h3>
      
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', flexWrap: 'nowrap', 
          alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '0.65rem 0.85rem', 
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)', overflowX: 'auto'
        }}>
          <div style={{ flex: '3 1 150px' }}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nova tarefa..."
              autoFocus
              style={{
                width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                fontSize: '0.85rem', backgroundColor: 'white', color: 'var(--text-main)', outline: 'none'
              }}
            />
          </div>
          
          <div style={{ flex: '1.5 1 100px' }}>
            <select
              value={targetArea}
              onChange={(e) => setTargetArea(e.target.value as Area | '')}
              style={{
                width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                fontSize: '0.85rem', backgroundColor: 'white', color: 'var(--text-main)', outline: 'none'
              }}
            >
              <option value="" disabled>-- Área --</option>
              {allAreas.map(area => (
                <option key={area} value={area}>{area.split('(')[0].trim()}</option> 
              ))}
            </select>
          </div>

          <div style={{ flex: '1.5 1 100px' }}>
            <select
              value={targetStore}
              onChange={(e) => setTargetStore(e.target.value)}
              style={{
                width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                fontSize: '0.85rem', backgroundColor: 'white', color: 'var(--text-main)', outline: 'none'
              }}
            >
              {isGlobalView && <option value="Todas as Lojas">Todas as Lojas</option>}
              {!isGlobalView && <option value="" disabled>-- Loja --</option>}
              {allStores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 0 115px', display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid var(--border-color)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-md)', backgroundColor: 'white' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>INÍCIO</span>
            <input 
              type="date"
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                if (e.target.value > targetEndDate) setTargetEndDate(e.target.value);
              }}
              style={{
                border: 'none', padding: '0.2rem', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', width: '75px'
              }}
            />
          </div>

          <div style={{ flex: '0 0 115px', display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid var(--border-color)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-md)', backgroundColor: 'white', opacity: targetEndDate !== targetDate ? 1 : 0.6 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>FIM</span>
            <input 
              type="date"
              value={targetEndDate}
              min={targetDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
              style={{
                border: 'none', padding: '0.2rem', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', width: '75px'
              }}
            />
          </div>

          <button type="submit" disabled={!inputValue.trim() || !targetStore || !targetArea || (recurrence === 'WEEKLY' && selectedDays.length === 0)} style={{
            flex: '0 0 auto', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 1rem',
            borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer',
            opacity: (inputValue.trim() && targetStore && targetArea) ? 1 : 0.5,
            height: '32px', fontSize: '0.8rem'
          }}>
            Adicionar
          </button>
        </form>

        {/* Recurrence Options Row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Repetir:</span>
            <select 
              value={recurrence} 
              onChange={(e) => setRecurrence(e.target.value)}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="NONE">Não repetir</option>
              <option value="WEEKLY">Semanalmente</option>
              <option value="MONTHLY">Mensalmente</option>
              <option value="LAST_DAY_OF_MONTH">Último dia do mês</option>
              <option value="QUARTERLY">Trimestralmente</option>
              <option value="QUADRIMESTER">Quadrimestralmente</option>
              <option value="SEMI_ANNUAL">Semestralmente</option>
              <option value="ANNUAL">Anualmente</option>
            </select>
          </div>

          {recurrence === 'WEEKLY' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {daysLabels.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-color)',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    backgroundColor: selectedDays.includes(i) ? 'var(--primary-color)' : 'white',
                    color: selectedDays.includes(i) ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {(recurrence === 'MONTHLY' || recurrence === 'ANNUAL') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dia:</span>
              <input 
                type="number" min="1" max="31" 
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                style={{ width: '50px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>
          )}
          
          {recurrence !== 'NONE' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>
              * Começa a contar a partir de hoje
            </span>
          )}
        </div>

        {/* BARRA DE PESQUISA (LUPA) REPOSICIONADA */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '1rem', color: '#94a3b8', fontSize: '1.2rem' }}>🔍</span>
            <input 
              type="text"
              placeholder="Procurar por uma tarefa ou rotina..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '0.75rem',
                border: '1px solid var(--border-color)', backgroundColor: 'white',
                fontSize: '0.9rem', color: 'var(--text-main)', outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s',
                borderColor: searchTerm ? 'var(--primary-color)' : 'var(--border-color)'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute', right: '1rem', background: 'none', border: 'none',
                  color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>

      {!hideList && (
        <>
          {groupedTasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedTasks.map(({ task, stores }) => {
            const isExpanded = expandedTasks.includes(task.id);
            const storesCompletedCount = isGlobalView ? tasks.filter(t => t.task.id === task.id && t.task.isCompleted).length : (task.isCompleted ? 1 : 0);
            const isAllCompleted = isGlobalView ? storesCompletedCount === stores.length : task.isCompleted;

            return (
              <div key={task.id} className="animate-fade" style={{ 
                flexDirection: 'column',
                backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease', cursor: 'pointer',
                marginBottom: '0.5rem', overflow: 'hidden'
              }} onClick={() => isGlobalView ? toggleExpand(task.id) : onOpenDetail?.(task, stores[0])}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id, storeName); }}
                    style={{
                      width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', flexShrink: 0,
                      border: 'none',
                      backgroundColor: isAllCompleted ? 'var(--success-color)' : '#a7f3d0',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span style={{ color: isAllCompleted ? '#fff' : '#059669', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                      {isAllCompleted ? '✓' : '...'}
                    </span>
                  </button>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p 
                        style={{
                          fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.2, margin: 0, fontWeight: 700,
                          textDecoration: (isAllCompleted && !isGlobalView) ? 'line-through' : 'none', 
                          opacity: (isAllCompleted && !isGlobalView) ? 0.6 : 1,
                        }}
                      >
                        {task.title}
                      </p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isGlobalView && (
                          <div style={{
                            fontSize: '0.8rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.5rem',
                            backgroundColor: isAllCompleted ? 'var(--success-color)' : (isExpanded ? 'var(--primary-color)' : 'var(--accent-dark)'),
                            color: isAllCompleted ? 'white' : (isExpanded ? 'white' : 'var(--primary-color)'),
                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                          }}>
                            {isAllCompleted ? 'Todas' : `${storesCompletedCount} / ${stores.length}`} Lojas
                            <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                          </div>
                        )}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const msg = isGlobalView ? 'Deseja eliminar esta tarefa de TODAS as lojas?' : 'Deseja eliminar esta tarefa?';
                            if (window.confirm(msg)) onDelete(task.id, storeName); 
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ff4444', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.3, padding: '0 0.5rem' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {task.area && (
                          <span style={{ 
                            fontSize: '0.65rem', backgroundColor: '#0f172a', color: 'var(--primary-color)', 
                            fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px', 
                            textTransform: 'uppercase', letterSpacing: '0.02em' 
                          }}>
                            {task.area}
                          </span>
                        )}
                        
                        {!isGlobalView && (
                          <span style={{ 
                            fontSize: '0.65rem', backgroundColor: '#0f172a', color: 'var(--primary-color)', 
                            fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px', 
                            textTransform: 'uppercase', letterSpacing: '0.02em' 
                          }}>
                            {stores[0]}
                          </span>
                        )}

                        {task.startDate && task.endDate && task.startDate !== task.endDate && (
                          <span style={{ 
                            fontSize: '0.65rem', backgroundColor: '#fef3c7', color: '#92400e', 
                            fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px', 
                            textTransform: 'uppercase', letterSpacing: '0.02em', border: '1px solid #fcd34d'
                          }}>
                            📅 {task.startDate} até {task.endDate}
                          </span>
                        )}

                        {task.recurrence && task.recurrence !== 'NONE' && (
                          <span title="Tarefa Recorrente" style={{ 
                            fontSize: '0.65rem', backgroundColor: '#e2e8f0', color: '#475569', 
                            fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px', 
                            display: 'flex', alignItems: 'center', gap: '4px' 
                          }}>
                            🔄 {task.recurrence}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Individual Store Toggles (for Global View) */}
                {isGlobalView && isExpanded && (
                  <div style={{ 
                    padding: '1rem', backgroundColor: 'var(--bg-color)', borderTop: '1px solid var(--border-color)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem'
                  }}>
                    {stores.map(s => {
                      const taskForStore = tasks.find(t => t.task.id === task.id && t.store === s)?.task;
                      const isStoreDone = taskForStore?.isCompleted;
                      const storeNotes = taskForStore?.notes;
                      
                      return (
                        <div key={s} className={`store-toggle-chip ${isStoreDone ? 'done' : ''}`} onClick={() => onToggle(task.id, s)} style={{
                          display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', borderRadius: '8px', 
                          border: `1px solid ${isStoreDone ? '#dcfce7' : '#e2e8f0'}`,
                          backgroundColor: isStoreDone ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isStoreDone ? '#166534' : '#64748b' }}>{s}</span>
                            <div style={{ 
                              width: '14px', height: '14px', borderRadius: '4px', border: '1px solid currentColor',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                            }}>
                              {isStoreDone ? '✓' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isGlobalView && task.notes && (
                  <div style={{ 
                    fontSize: '0.85rem', color: 'var(--text-muted)', 
                    margin: '0 1.25rem 1.25rem 1.25rem',
                    padding: '0.75rem', backgroundColor: '#f8fafc', 
                    borderRadius: '8px', fontStyle: 'italic', borderLeft: '4px solid var(--primary-color)'
                  }}>
                    {task.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0', opacity: 0.7 }}>
            Ainda não há tarefas para este dia.
          </div>
        )}
        </>
      )}
    </div>
  );
}
