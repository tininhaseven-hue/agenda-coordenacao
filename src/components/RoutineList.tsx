'use client';

import { useState } from 'react';
import { Routine, ALL_STORES, RoutineExecution } from '@/types';
import { Checkbox } from './Checkbox';
import { OverdueRoutine } from '@/hooks/useRoutines';
import { getPortugueseDayName } from '@/utils/routineUtils';

function GlobalRoutineItem({ routine, allRoutineData, onToggle, onOpenDetail, isOverdue, overdueLabel }: { routine: Routine; allRoutineData: Record<string, Record<string, RoutineExecution>>; onToggle: (storeOverride?: string) => void; onOpenDetail?: () => void; isOverdue?: boolean; overdueLabel?: string }) {
  const [showDescription, setShowDescription] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const storesWithData = ALL_STORES.filter(s => allRoutineData[s]?.[routine.id]?.completed);
  const storesCompleted = storesWithData.length;
  const isAllCompleted = storesCompleted === ALL_STORES.length;
  const storesWithNotes = ALL_STORES.filter(s => allRoutineData[s]?.[routine.id]?.notes);

  return (
    <div 
      className={`routine-item ${isAllCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`} 
      style={{ cursor: 'pointer', transition: 'all 0.2s', opacity: isAllCompleted ? 0.8 : 1, flexDirection: 'column', alignItems: 'flex-start' }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
        <div className="routine-checkbox-wrapper" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <input 
            type="checkbox" 
            className="routine-checkbox" 
            checked={isAllCompleted} 
            readOnly 
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="routine-content" style={{ flex: 1 }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onOpenDetail?.(); }}>
              <span className="routine-text" style={{ textDecoration: isAllCompleted ? 'line-through' : 'none', fontWeight: 700 }}>
                {routine.title}
                {routine.description && (
                  <button
                    className="info-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDescription(!showDescription);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: '1.5px solid #94a3b8',
                      background: showDescription ? 'var(--primary-color)' : 'transparent',
                      color: showDescription ? 'white' : '#64748b',
                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                      marginLeft: '0.5rem', flexShrink: 0, transition: 'all 0.2s ease',
                      verticalAlign: 'middle',
                    }}
                  >
                    i
                  </button>
                )}
              </span>
              {routine.isCritical && <span className="critical-badge">Importante</span>}
            </div>
            {overdueLabel && (
              <div className="overdue-badge" style={{ marginBottom: '0.5rem' }}>Em Atraso - {overdueLabel}</div>
            )}
            <div style={{
              fontSize: '0.82rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '0.5rem',
              backgroundColor: isAllCompleted ? 'var(--success-color)' : (isExpanded ? 'var(--primary-color)' : 'var(--accent-dark)'),
              color: isAllCompleted ? 'white' : (isExpanded ? 'white' : 'var(--primary-color)'),
              border: `1px solid ${isAllCompleted ? 'transparent' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '1rem' }}>{isAllCompleted ? '✓' : '📊'}</span>
              {isAllCompleted ? 'Todas' : `${storesCompleted} / ${ALL_STORES.length}`} Lojas
              <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
          </div>
        </div>
      </div>

      {showDescription && routine.description && (
        <div style={{
          marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f0f4ff',
          borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6',
          fontSize: '0.82rem', lineHeight: '1.6', color: '#334155',
          whiteSpace: 'pre-line', width: 'calc(100% - 3rem)', marginLeft: '3rem'
        }}>
          {routine.description}
        </div>
      )}

      {isExpanded && (
        <div style={{ 
          width: 'calc(100% - 3rem)', marginLeft: '3rem', marginTop: '1rem', 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem',
          padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)',
          boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)', border: '1px solid var(--border-color)'
        }}>
          {ALL_STORES.map(store => {
            const isDone = allRoutineData[store]?.[routine.id]?.completed;
            return (
              <div 
                key={store} 
                onClick={(e) => { e.stopPropagation(); onToggle(store); }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                  borderRadius: '0.4rem', backgroundColor: 'white', border: `1px solid ${isDone ? 'var(--success-color)' : 'var(--border-color)'}`,
                  transition: 'all 0.1s ease', transform: 'scale(1)',
                  boxShadow: isDone ? '0 2px 4px rgba(16, 185, 129, 0.1)' : 'none'
                }}
              >
                <div style={{ 
                  width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isDone ? 'var(--success-color)' : '#cbd5e1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? 'var(--success-color)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  {isDone && <span style={{ color: 'white', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDone ? 'var(--success-color)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {store}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {storesWithNotes.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff9eb', borderRadius: '0.5rem', border: '1px solid #fde68a', width: 'calc(100% - 3rem)', marginLeft: '3rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas da Coordenação/Lojas:</div>
          {(() => {
            const uniqueNotesMap = new Map<string, string[]>();
            storesWithNotes.forEach(s => {
              const note = allRoutineData[s][routine.id].notes;
              if (note) {
                if (!uniqueNotesMap.has(note)) uniqueNotesMap.set(note, []);
                uniqueNotesMap.get(note)!.push(s);
              }
            });

            return Array.from(uniqueNotesMap.entries()).map(([note, stores], idx) => {
              const isCommonNote = stores.length === ALL_STORES.length;
              return (
                <div key={idx} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem', borderLeft: '2px solid #fbbf24', paddingLeft: '0.5rem' }}>
                  {!isCommonNote && <strong style={{ color: '#1e293b' }}>{stores.join(', ')}:</strong>} 
                  <span dangerouslySetInnerHTML={{ __html: note }} />
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

interface Props {
  title: string;
  routines: Routine[];
  routineData: Record<string, RoutineExecution>;
  allRoutineData?: Record<string, Record<string, RoutineExecution>>;
  isGlobalView?: boolean;
  onToggle: (id: string, dateOverride?: string, storeOverride?: string) => void;
  onNoteChange: (id: string, note: string, dateOverride?: string, storeOverride?: string) => void;
  onOpenDetail?: (routine: Routine, overdueDate?: string) => void;
  overdueRoutines?: OverdueRoutine[];
}

export function RoutineList({ 
  title, routines, routineData, allRoutineData, isGlobalView, onToggle, onNoteChange, onOpenDetail, overdueRoutines = [] 
}: Props) {
  if (routines.length === 0 && overdueRoutines.length === 0) return null;

  let totalTasks = 0;
  let completedCount = 0;
  
  if (isGlobalView && allRoutineData) {
    routines.forEach(r => {
       const totalHidden = ALL_STORES.filter(s => allRoutineData[s]?.[r.id]?.isHidden).length;
       if (totalHidden === ALL_STORES.length) return;

       totalTasks += ALL_STORES.length;
       ALL_STORES.forEach(store => {
          if (allRoutineData[store]?.[r.id]?.completed) completedCount++;
       });
    });
  } else {
    const visibleRoutines = routines.filter(r => !routineData[r.id]?.isHidden);
    totalTasks = visibleRoutines.length;
    completedCount = visibleRoutines.filter(r => routineData[r.id]?.completed).length;
  }

  return (
    <div className="category-block">
      <div className="category-header">
        <h3 className="category-title">{title}</h3>
        <span className="progress-pill">
          {completedCount} / {totalTasks}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {routines
          .filter(r => {
            if (isGlobalView && allRoutineData) {
              const totalHidden = ALL_STORES.filter(s => allRoutineData[s]?.[r.id]?.isHidden).length;
              return totalHidden < ALL_STORES.length;
            }
            return !routineData[r.id]?.isHidden;
          })
          .map((routine) => {
            const execution = routineData[routine.id] || { completed: false, notes: '' };

          if (isGlobalView && allRoutineData) {
            return (
              <GlobalRoutineItem 
                key={routine.id} 
                routine={routine} 
                allRoutineData={allRoutineData} 
                onToggle={(store) => onToggle(routine.id, undefined, store)}
                onOpenDetail={() => onOpenDetail?.(routine)} 
              />
            );
          }

          return (
            <Checkbox 
              key={routine.id}
              routine={routine}
              checked={execution.completed}
              notes={execution.notes || ''}
              onChange={() => onToggle(routine.id)}
              onNoteChange={(note) => onNoteChange(routine.id, note)}
              onOpenDetail={() => onOpenDetail?.(routine)}
            />
          );
        })}

        {/* SECÇÃO DE ATRASOS */}
        {overdueRoutines.length > 0 && overdueRoutines
          .filter(r => {
            if (isGlobalView && allRoutineData) {
              const totalHidden = ALL_STORES.filter(s => allRoutineData[s]?.[r.id]?.isHidden).length;
              return totalHidden < ALL_STORES.length;
            }
            return !routineData[r.id]?.isHidden;
          })
          .map((overdue) => {
          const originalDateObj = new Date(overdue.originalDate);
          const dayName = getPortugueseDayName(originalDateObj);
          
          if (isGlobalView && allRoutineData) {
            return (
              <GlobalRoutineItem 
                key={`${overdue.id}_${overdue.originalDate}`} 
                routine={overdue} 
                allRoutineData={allRoutineData} 
                onToggle={(store) => onToggle(overdue.id, overdue.originalDate, store)}
                onOpenDetail={() => onOpenDetail?.(overdue, overdue.originalDate)}
                isOverdue
                overdueLabel={dayName}
              />
            );
          }

          return (
            <Checkbox 
              key={`${overdue.id}_${overdue.originalDate}`}
              routine={overdue}
              checked={false} // Sempre false pois se estivesse true não estaria em overdueRoutines
              notes={''} // No hook OverdueRoutine não trazemos notas antigas por agora, ou poderíamos
              onChange={() => onToggle(overdue.id, overdue.originalDate)}
              onNoteChange={(note) => onNoteChange(overdue.id, note, overdue.originalDate)}
              onOpenDetail={() => onOpenDetail?.(overdue, overdue.originalDate)}
              isOverdue
              overdueLabel={dayName}
            />
          );
        })}
      </div>
    </div>
  );
}
