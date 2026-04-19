'use client';

import { useState } from 'react';
import { Visit, VisitType, Store, ALL_STORES } from '@/types';
import { useVisits } from '@/hooks/useVisits';
import { exportVisitReportToExcel } from '@/utils/reportExportUtils';

interface VisitsManagerProps {
  activeStore: string;
}

export function VisitsManager({ activeStore }: VisitsManagerProps) {
  const { visits, addVisit, updateVisit, deleteVisit, updateChecklistItem, deleteChecklistItem, addChecklistItem } = useVisits();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [newAdHocTask, setNewAdHocTask] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = (visit: Visit) => {
    exportVisitReportToExcel(visit);
  };

  const handleAddAdHocTask = (e: React.FormEvent, visitId: string) => {
    e.preventDefault();
    if (!newAdHocTask.trim()) return;
    addChecklistItem(visitId, newAdHocTask.trim());
    setNewAdHocTask('');
  };

  // Form states
  const [newStore, setNewStore] = useState<Store>(activeStore === 'Todas as Lojas' ? ALL_STORES[0] : activeStore as Store);
  const [newDate, setNewDate] = useState(new Date().toISOString().substring(0, 10));
  const [newType, setNewType] = useState<VisitType>('ESTRUTURADO');
  const [newAccompaniment, setNewAccompaniment] = useState('');
  const [newObjective, setNewObjective] = useState('');

  // Helper for image upload
  const handleImageUpload = (visitId: string, itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Basic compression by using a smaller canvas if needed would be here, 
      // but for now we'll just store the base64.
      const base64 = reader.result as string;
      updateChecklistItem(visitId, itemId, { photo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisit(newStore, newDate, newType, newAccompaniment, newObjective);
    setIsAdding(false);
    setNewObjective('');
    setNewAccompaniment('');
  };

  const filteredVisits = visits.filter(v => activeStore === 'Todas as Lojas' || v.store === activeStore);
  const selectedVisit = visits.find(v => v.id === selectedVisitId);

  // Count progress based on OK/NAO_OK status
  const getVisitProgress = (visit: Visit) => {
     if (!visit.checklist) return 0;
     const actedItems = visit.checklist.filter(i => i.status && i.status !== 'PENDENTE').length;
     return (actedItems / visit.checklist.length) * 100;
  };

  return (
    <div className="visits-manager animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="group-title" style={{ margin: 0 }}>Gestão de Visitas e Auditoria de Loja</h2>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Planeamento e registo das visitas presenciais às unidades.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary"
            style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800,
              backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            <span>➕</span> Nova Visita
          </button>
        )}
      </div>

      {isAdding && (
        <div style={{ 
          backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', 
          marginBottom: '2rem', boxShadow: 'var(--shadow-md)' 
        }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Planear Nova Visita</h3>
          <form onSubmit={handleAddVisit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>LOJA</label>
              <select 
                value={newStore} 
                onChange={(e) => setNewStore(e.target.value as Store)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                {ALL_STORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DATA DA VISITA</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                required
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TIPO DE AUDITORIA</label>
              <select 
                value={newType} 
                onChange={(e) => setNewType(e.target.value as VisitType)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                <option value="ESTRUTURADO">Estruturado / Anunciado</option>
                <option value="CURTA_DURACAO">Curta Duração / Não Anunciado</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACOMPANHADO POR</label>
              <input 
                type="text" 
                placeholder="Ex: Gerente de Loja"
                value={newAccompaniment} 
                onChange={(e) => setNewAccompaniment(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>OBJETIVOS PRINCIPAIS</label>
              <input 
                type="text" 
                placeholder="Resumo do que pretende validar..."
                value={newObjective} 
                onChange={(e) => setNewObjective(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" style={{ 
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', 
                backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 800, cursor: 'pointer' 
              }}>
                Confirmar Agendamento
              </button>
              <button type="button" onClick={() => setIsAdding(false)} style={{ 
                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', 
                backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' 
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="visits-content" style={{ display: 'grid', gridTemplateColumns: selectedVisitId ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        <div className="visits-list">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Histórico e Próximas Visitas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredVisits.map(visit => (
              <div 
                key={visit.id}
                onClick={() => setSelectedVisitId(visit.id)}
                style={{ 
                  backgroundColor: 'white', padding: '1.25rem', borderRadius: '1rem', 
                  border: `2px solid ${selectedVisitId === visit.id ? 'var(--primary-color)' : '#f1f5f9'}`,
                  cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569', 
                    padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase' 
                  }}>
                    {visit.type === 'ESTRUTURADO' ? '📋 Estruturado' : '⚡ Curta Duração'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{visit.date}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (confirm(`Tem a certeza que deseja eliminar a visita a ${visit.store}?`)) {
                          deleteVisit(visit.id); 
                          if (selectedVisitId === visit.id) setSelectedVisitId(null);
                        }
                      }}
                      className="no-print"
                      style={{ 
                        background: '#fee2e2', border: 'none', borderRadius: '50%',
                        width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      title="Eliminar esta visita"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredVisits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '2px dashed #e2e8f0' }}>
                <span style={{ fontSize: '2rem' }}>📍</span>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem' }}>Sem registos de visitas nesta loja.</p>
              </div>
            )}
          </div>
        </div>

        {selectedVisit && (
          <div className="visit-detail animate-fade" style={{ 
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  Auditoria de Loja: {selectedVisit.store}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                   {selectedVisit.type === 'ESTRUTURADO' ? 'Modelo Estruturado / Anunciado' : 'Modelo Curta Duração / Não Anunciado'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleExportExcel(selectedVisit)}
                  className="no-print"
                  style={{ 
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  📗 Baixar Excel
                </button>
                <button 
                  onClick={handlePrint}
                  className="no-print"
                  style={{ 
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--primary-color)',
                    backgroundColor: 'rgba(235, 163, 0, 0.1)', color: 'var(--primary-color)',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  📄 Emitir Relatório
                </button>
                <button 
                  onClick={() => setSelectedVisitId(null)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Acompanhado por</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedVisit.accompaniment || 'N/A'}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                 <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Estado</span>
                 <select 
                   value={selectedVisit.status}
                   onChange={(e) => updateVisit(selectedVisit.id, { status: e.target.value as any })}
                   style={{ 
                     display: 'block', width: '100%', background: 'transparent', border: 'none', 
                     fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', outline: 'none' 
                   }}
                 >
                   <option value="PLANEADA">Planeada</option>
                   <option value="CONCLUÍDA">Concluída</option>
                 </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase' }}>Checklist de Verificação</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {selectedVisit.checklist.map(item => (
                  <div key={item.id} style={{ 
                    paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', position: 'relative'
                  }}>
                    <button 
                      onClick={() => deleteChecklistItem(selectedVisit.id, item.id)}
                      className="no-print"
                      style={{ 
                        position: 'absolute', right: '-0.5rem', top: '-0.5rem', 
                        background: 'none', border: 'none', cursor: 'pointer', opacity: 0.2
                      }}
                      title="Eliminar tarefa"
                    >🗑️</button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                       <div style={{ flex: 1 }}>
                          <span style={{ 
                            fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', 
                            lineHeight: 1.4, display: 'block'
                          }}>
                            {item.text}
                          </span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            onClick={() => updateChecklistItem(selectedVisit.id, item.id, { status: 'OK' })}
                            style={{ 
                              padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid',
                              borderColor: item.status === 'OK' ? 'var(--success-color)' : '#e2e8f0',
                              backgroundColor: item.status === 'OK' ? 'var(--success-color)' : 'white',
                              color: item.status === 'OK' ? 'white' : '#64748b',
                              fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.1s'
                            }}
                          >
                            OK
                          </button>
                          <button 
                            onClick={() => updateChecklistItem(selectedVisit.id, item.id, { status: 'NAO_OK' })}
                            style={{ 
                              padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid',
                              borderColor: item.status === 'NAO_OK' ? 'var(--critical-color)' : '#e2e8f0',
                              backgroundColor: item.status === 'NAO_OK' ? 'var(--critical-color)' : 'white',
                              color: item.status === 'NAO_OK' ? 'white' : '#64748b',
                              fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.1s'
                            }}
                          >
                            NÃO OK
                          </button>
                       </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                       <div style={{ flex: 1 }}>
                          <input 
                            type="text"
                            placeholder="Adicionar observação específica..."
                            value={item.observations}
                            onChange={(e) => updateChecklistItem(selectedVisit.id, item.id, { observations: e.target.value })}
                            style={{ 
                              width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', 
                              fontSize: '0.75rem', outline: 'none', backgroundColor: '#fcfcfc'
                            }}
                          />
                       </div>
                       
                       <div style={{ position: 'relative' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" // Forces camera on mobile
                            id={`file-${item.id}`}
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(selectedVisit.id, item.id, e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                          <label 
                            htmlFor={`file-${item.id}`}
                            style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #e2e8f0',
                              backgroundColor: '#fff', cursor: 'pointer', overflow: 'hidden'
                            }}
                          >
                            {item.photo ? (
                              <img src={item.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Evidência" />
                            ) : (
                              <span style={{ fontSize: '1rem' }}>📷</span>
                            )}
                          </label>
                          {item.photo && (
                            <button 
                              onClick={() => updateChecklistItem(selectedVisit.id, item.id, { photo: undefined })}
                              style={{ 
                                position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'var(--critical-color)',
                                color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px',
                                fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >✕</button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}

                {/* Formulário para Adicionar Tarefa Ad-Hoc */}
                <form 
                  onSubmit={(e) => handleAddAdHocTask(e, selectedVisit.id)}
                  className="no-print"
                  style={{ 
                    marginTop: '1.5rem', display: 'flex', gap: '0.75rem', 
                    padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1'
                  }}
                >
                  <input 
                    type="text"
                    placeholder="Encontrou algo extra? Adicione aqui..."
                    value={newAdHocTask}
                    onChange={(e) => setNewAdHocTask(e.target.value)}
                    style={{ 
                      flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', 
                      outline: 'none', fontSize: '0.85rem' 
                    }}
                  />
                  <button 
                    type="submit"
                    style={{ 
                      padding: '0.6rem 1rem', borderRadius: '8px', border: 'none',
                      backgroundColor: 'var(--text-main)', color: 'white', fontWeight: 700,
                      fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    ➕ Adicionar Ponto
                  </button>
                </form>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Notas e Conclusões Gerais</h4>
              <textarea 
                placeholder="Registe aqui as principais conclusões e planos de ação acordados..."
                value={selectedVisit.notes}
                onChange={(e) => updateVisit(selectedVisit.id, { notes: e.target.value })}
                style={{ 
                  width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '1rem', 
                  border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.85rem',
                  fontFamily: 'inherit', resize: 'vertical'
                }}
              />
            </div>

            {/* RELATÓRIO DE IMPRESSÃO - Oculto na UI normal */}
            <div className="print-only">
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '3px solid var(--primary-color)', paddingBottom: '1rem' }}>
                <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>RELATÓRIO DE VISITA E AUDITORIA</h1>
                <p style={{ fontWeight: 800, margin: '0.5rem 0 0 0' }}>IBERSOL - GESTÃO DE UNIDADES</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                 <div>
                   <p><strong>Loja:</strong> {selectedVisit.store}</p>
                   <p><strong>Data:</strong> {selectedVisit.date}</p>
                   <p><strong>Tipo:</strong> {selectedVisit.type === 'ESTRUTURADO' ? 'Estruturado / Anunciado' : 'Curta Duração / Não Anunciado'}</p>
                 </div>
                 <div>
                   <p><strong>Acompanhado por:</strong> {selectedVisit.accompaniment || 'N/A'}</p>
                   <p><strong>Objetivo:</strong> {selectedVisit.objective}</p>
                   <p><strong>Estado Final:</strong> {selectedVisit.status}</p>
                 </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Resultados da Checklist</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem' }}>Tarefa</th>
                    <th style={{ padding: '0.5rem', width: '100px' }}>Estado</th>
                    <th style={{ padding: '0.5rem' }}>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVisit.checklist.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{item.text}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          fontWeight: 900, 
                          color: item.status === 'OK' ? '#166534' : item.status === 'NAO_OK' ? '#991b1b' : '#64748b'
                        }}>
                          {item.status === 'OK' ? '✅ OK' : item.status === 'NAO_OK' ? '❌ NÃO OK' : 'PENDENTE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {item.observations || '-'}
                        {item.photo && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <img src={item.photo} style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #e2e8f0' }} alt="Evidência" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '1rem' }}>
                 <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Conclusões Finais</h2>
                 <p style={{ whiteSpace: 'pre-wrap' }}>{selectedVisit.notes || 'Sem notas adicionais.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
