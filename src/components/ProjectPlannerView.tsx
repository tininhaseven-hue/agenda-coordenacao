'use client';

import { useState } from 'react';
import { Project, PlannerEntry, ALL_STORES } from '@/types';

interface ProjectPlannerViewProps {
  project: Project;
  onUpdateEntries: (projectId: string, month: number, entries: PlannerEntry[]) => void;
  onUpdateNotes: (projectId: string, notes: string) => void;
}

const MONTHS = [
  { name: 'Janeiro', color: '#fef3c7', textColor: '#92400e' },
  { name: 'Fevereiro', color: '#dcfce7', textColor: '#166534' },
  { name: 'Março', color: '#dbeafe', textColor: '#1e40af' },
  { name: 'Abril', color: '#fce7f3', textColor: '#9d174d' },
  { name: 'Maio', color: '#ffedd5', textColor: '#9a3412' },
  { name: 'Junho', color: '#14532d', textColor: '#ffffff' },
  { name: 'Julho', color: '#991b1b', textColor: '#ffffff' },
  { name: 'Agosto', color: '#7f1d1d', textColor: '#ffffff' },
  { name: 'Setembro', color: '#78350f', textColor: '#ffffff' },
  { name: 'Outubro', color: '#1e3a8a', textColor: '#ffffff' },
  { name: 'Novembro', color: '#c2410c', textColor: '#ffffff' },
  { name: 'Dezembro', color: '#450a0a', textColor: '#ffffff' }
];

export function ProjectPlannerView({ project, onUpdateEntries, onUpdateNotes }: ProjectPlannerViewProps) {
  const [addingToMonth, setAddingToMonth] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newDate, setNewDate] = useState('');

  const handleAddEntry = (month: number) => {
    if (!newName || !newStore || !newDate) return;
    
    const currentEntries = project.plannerData?.[month] || [];
    const newEntry: PlannerEntry = {
      id: `ent_${Date.now()}`,
      name: newName,
      store: newStore,
      date: newDate,
      month,
      year: 2026
    };
    
    onUpdateEntries(project.id, month, [...currentEntries, newEntry]);
    resetForm();
  };

  const removeEntry = (month: number, entryId: string) => {
    const currentEntries = project.plannerData?.[month] || [];
    onUpdateEntries(project.id, month, currentEntries.filter(e => e.id !== entryId));
  };

  const resetForm = () => {
    setAddingToMonth(null);
    setNewName('');
    setNewStore('');
    setNewDate('');
  };

  return (
    <div className="project-planner-view animate-fade" style={{ marginTop: '1.5rem' }}>
      <div className="planner-grid">
        {MONTHS.map((m, idx) => {
          const entries = project.plannerData?.[idx] || [];
          return (
            <div key={m.name} className="month-box">
              <div 
                className="month-header" 
                style={{ backgroundColor: m.color, color: m.textColor }}
              >
                {m.name}
              </div>
              <div className="month-content">
                {entries.map(ent => (
                  <div key={ent.id} className="planner-entry">
                    <div className="entry-text">
                      <span className="name">{ent.name}</span>
                      <span className="store">({ent.store})</span>
                      <span className="date">{ent.date}</span>
                    </div>
                    <button className="delete-entry no-print" onClick={() => removeEntry(idx, ent.id)}>×</button>
                  </div>
                ))}

                {addingToMonth === idx ? (
                  <div className="add-entry-form no-print">
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome..." />
                    <input value={newStore} onChange={e => setNewStore(e.target.value)} placeholder="Loja (ex: VPN)..." />
                    <input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="Data... " />
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleAddEntry(idx)} className="save-btn">Guardar</button>
                      <button onClick={resetForm} className="cancel-btn">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="add-btn no-print" onClick={() => setAddingToMonth(idx)}>+ Adicionar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="planner-notes">
        <h3>Notas e Agendamentos Futuros</h3>
        <textarea 
          className="notes-textarea-ui"
          value={project.projectNotes || ''} 
          onChange={(e) => onUpdateNotes(project.id, e.target.value)}
          placeholder="Ex: Pessoal agendado para 2027/2028..."
        />
        <div className="notes-print-view">
          {project.projectNotes || 'Nenhuma nota registada.'}
        </div>
      </div>

      <style jsx>{`
        .planner-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .month-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          min-height: 150px;
          display: flex;
          flex-direction: column;
        }

        .month-header {
          padding: 0.5rem;
          text-align: center;
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }

        .month-content {
          padding: 0.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .planner-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem;
          background: #f8fafc;
          border-radius: 4px;
          font-size: 0.8rem;
          border-left: 3px solid #cbd5e1;
        }

        .entry-text {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .name { font-weight: 700; color: #1e293b; }
        .store { color: #64748b; }
        .date { color: #0284c7; font-weight: 600; }

        .delete-entry {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 1.1rem;
          cursor: pointer;
          line-height: 1;
        }

        .add-btn {
          width: 100%;
          padding: 0.4rem;
          background: transparent;
          border: 1px dashed #cbd5e1;
          border-radius: 4px;
          color: #94a3b8;
          font-size: 0.75rem;
          cursor: pointer;
          margin-top: auto;
        }

        .add-btn:hover { background: #f8fafc; color: #64748b; }

        .add-entry-form {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.5rem;
          background: #f1f5f9;
          border-radius: 6px;
        }

        .add-entry-form input {
          padding: 0.3rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .save-btn { background: #1e293b; color: white; border: none; border-radius: 4px; padding: 0.3rem 0.5rem; font-size: 0.7rem; cursor: pointer; }
        .cancel-btn { background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0.3rem 0.5rem; font-size: 0.7rem; cursor: pointer; }

        .planner-notes {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .planner-notes h3 {
          font-size: 1rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .planner-notes textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          color: #334155;
          line-height: 1.5;
          outline: none;
        }

        .notes-print-view { display: none; }
        @media print {
          .planner-grid { grid-template-columns: repeat(3, 1fr); }
          .month-box { min-height: 100px; page-break-inside: avoid; }
          .notes-textarea-ui { display: none !important; }
          .notes-print-view { 
            display: block !important; 
            font-size: 0.95rem; 
            color: #000; 
            white-space: pre-wrap;
            padding: 1rem;
            border: 1px solid #000;
            border-radius: 4px;
            margin-top: 1rem;
          }
          .planner-notes { margin-top: 2rem; border: none; box-shadow: none; padding: 0; display: block !important; visibility: visible !important; }
          .planner-notes h3 { color: #000; font-size: 1.1rem; display: block !important; }
        }
      `}</style>
    </div>
  );
}
