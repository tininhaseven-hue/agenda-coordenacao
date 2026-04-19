'use client';

import { useState } from 'react';
import { Routine } from '@/types';

interface Props {
  routine: Routine;
  checked: boolean;
  notes: string;
  onChange: () => void;
  onNoteChange: (note: string) => void;
  onOpenDetail?: () => void;
  isOverdue?: boolean;
  overdueLabel?: string;
}

export function Checkbox({ routine, checked, notes, onChange, onNoteChange, onOpenDetail, isOverdue, overdueLabel }: Props) {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div className={`routine-item ${checked ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`} onClick={(e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'checkbox') return;
      if ((e.target as HTMLElement).closest('.info-btn') || (e.target as HTMLElement).closest('.description-panel')) return;
      onChange();
    }}>
      <div className="routine-checkbox-wrapper" onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}>
        <input 
          type="checkbox" 
          className="routine-checkbox"
          checked={checked}
          readOnly
        />
      </div>
      <div className="routine-content" onClick={(e) => {
        if (onOpenDetail) {
          e.stopPropagation();
          onOpenDetail();
        }
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <span className="routine-text">
            {routine.title}
            {routine.description && (
              <button
                className="info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDescription(!showDescription);
                }}
                title="Ver informação"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1.5px solid #94a3b8',
                  background: showDescription ? 'var(--primary-color)' : 'transparent',
                  color: showDescription ? 'white' : '#64748b',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  verticalAlign: 'middle',
                }}
              >
                i
              </button>
            )}
          </span>
          {routine.isCritical && (
            <span className="critical-badge">Importante</span>
          )}
        </div>
        
        {overdueLabel && (
          <div className="overdue-badge">Em Atraso - {overdueLabel}</div>
        )}

        {showDescription && routine.description && (
          <div
            className="description-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#f0f4ff',
              borderRadius: '0.5rem',
              borderLeft: '3px solid #3b82f6',
              fontSize: '0.82rem',
              lineHeight: '1.6',
              color: '#334155',
              whiteSpace: 'pre-line',
              width: '100%',
            }}
          >
            {routine.description}
          </div>
        )}
        
        <div className="routine-notes-container" onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a6e12', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Notas:</div>
          <input
            type="text"
            className="routine-notes-input"
            placeholder="Notas..."
            value={notes}
            onChange={(e) => onNoteChange(e.target.value)}
            onBlur={(e) => onNoteChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
