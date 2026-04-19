import { Area, ALL_STORES, Project, ProjectType } from '@/types';

interface ProjectCardProps {
  project: Project;
  store: string;
  isGlobalView: boolean;
  allStores: readonly string[];
  getProgress: (projectId: string, store: string) => number;
  isTaskDone: (projectId: string, taskId: string, store: string) => boolean;
  isCellDone: (projectId: string, rowId: string, colId: string, store: string) => boolean;
  onOpenDetail: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  getStoreRows: (projectId: string, store: string) => any[];
  getStoreWorkspaceBlocks: (projectId: string, store: string) => any[];
}

export function ProjectCard({
  project, store, isGlobalView, allStores, getProgress, isTaskDone, isCellDone, onOpenDetail, onDeleteProject, onRenameProject, getStoreRows, getStoreWorkspaceBlocks
}: ProjectCardProps) {
  const currentProgress = getProgress(project.id, store === 'Todas as Lojas' ? allStores[0] : store);

  const handleDelete = () => {
    if (window.confirm(`Tem a certeza que deseja eliminar o projeto "${project.title}"? Todos os dados de todas as lojas serão apagados.`)) {
      onDeleteProject(project.id);
    }
  };

  return (
    <div className="project-card animate-fade" style={{
      backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0',
      padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span style={{ 
            fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569', 
            padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '0.5rem'
          }}>
            {project.area}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{project.title}</h3>
            <button 
              onClick={() => {
                const newTitle = window.prompt('Novo nome do projeto:', project.title);
                if (newTitle) onRenameProject(project.id, newTitle);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.5 }}
              title="Renomear Projeto"
            >
              ✏️
            </button>
          </div>
        </div>
        <button 
          onClick={handleDelete}
          style={{ 
            background: '#fee2e2', border: 'none', color: '#ef4444', 
            width: '32px', height: '32px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Eliminar Projeto"
        >
          🗑️
        </button>
      </div>

      {project.type === 'WORKSPACE' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" cy="50" r="40" stroke="var(--primary-color)" strokeWidth="10" fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - currentProgress / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <span style={{ position: 'absolute', fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{currentProgress}%</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Estado de Conclusão</h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
              {(() => {
                const currentBlocks = getStoreWorkspaceBlocks(project.id, store === 'Todas as Lojas' ? allStores[0] : store);
                return (currentBlocks?.filter((b: any) => b.type === 'CHECKLIST') || []).length;
              })()} Módulos de Checklist Ativos
            </p>
          </div>
        </div>
      )}

      {project.type === 'MAINTENANCE' ? (
        <div style={{ backgroundColor: '#f0f9ff', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #bae6fd' }}>
           <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Histórico de Manutenções</span>
            <span>{(() => {
              let total = 0;
              Object.values(project.maintenanceData || {}).forEach(list => total += list.length);
              return `${total} Registos`;
            })()}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {isGlobalView ? (
              allStores.map(s => {
                const tasks = (project.maintenanceData || {})[s] || [];
                const total = tasks.reduce((acc, t) => acc + t.amountPaid, 0);
                const unsolved = tasks.filter(t => !t.validationDate).length;
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>{s}</span>
                      {unsolved > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 900 }}>
                          {unsolved}
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 800, color: '#0369a1' }}>{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                  </div>
                );
              })
            ) : (() => {
              const tasks = (project.maintenanceData || {})[store] || [];
              const total = tasks.reduce((acc, t) => acc + t.amountPaid, 0);
              const unsolved = tasks.filter(t => !t.validationDate).length;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>VALOR TOTAL PAGO</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0369a1' }}>{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>REGISTOS</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>{tasks.length}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800 }}>POR RESOLVER</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ef4444' }}>{unsolved}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : project.type === 'INCIDENTS' ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Controlo Mensal — {(() => {
              const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              return months[new Date().getMonth()];
            })()}</span>
            <span style={{ color: 'var(--primary-color)' }}>{(() => {
              const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
              let total = 0;
              Object.entries(project.incidentData || {}).forEach(([key, list]) => {
                if (key.endsWith(`||${ym}`)) total += list.length;
              });
              return `${total} Incidentes`;
            })()}</span>
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isGlobalView ? (
              allStores.map(s => {
                const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const incidents = (project.incidentData || {})[`${s}||${ym}`] || [];
                const totalMonth = incidents.reduce((a, i) => a + i.costExVat, 0);
                const budgYear = (project.incidentBudgets || {})[s] || 0;
                const budgMonth = budgYear / 12;
                const ro = totalMonth - budgMonth;
                
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>{s}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>{totalMonth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                      <span style={{ fontSize: '0.65rem', color: ro > 0 ? '#ef4444' : '#16a34a', marginLeft: '0.5rem', fontWeight: 700 }}>
                        {ro > 0 ? `+${ro.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €` : `${ro.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (() => {
              const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
              const incidents = (project.incidentData || {})[`${store}||${ym}`] || [];
              const totalMonth = incidents.reduce((a, i) => a + i.costExVat, 0);
              const budgYear = (project.incidentBudgets || {})[store] || 0;
              const budgMonth = budgYear / 12;
              const ro = totalMonth - budgMonth;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                    <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>GASTO</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>{totalMonth.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €</div>
                    </div>
                    <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>ORÇ.</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>{budgMonth.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €</div>
                    </div>
                    <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>R/O</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: ro > 0 ? '#ef4444' : '#16a34a' }}>
                        {ro > 0 ? `+${ro.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}` : ro.toLocaleString('pt-PT', { maximumFractionDigits: 0 })} €
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b', textAlign: 'center' }}>
                    {incidents.length} incidente(s) registado(s) este mês.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : project.type === 'PLANNER' ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.85rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Agendamentos de {(() => {
              const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              return months[new Date().getMonth()];
            })()}</span>
            <span style={{ color: 'var(--primary-color)' }}>{project.plannerData?.[new Date().getMonth().toString()]?.length || 0} Total</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(project.plannerData?.[new Date().getMonth().toString()] || []).slice(0, 5).map(ent => (
              <div key={ent.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #f1f5f9',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{ent.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{ent.store}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-color)', backgroundColor: '#fff7ed', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {ent.date.split('/')[0]}/{ent.date.split('/')[1]}
                </span>
              </div>
            ))}
            {(project.plannerData?.[new Date().getMonth().toString()] || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Nenhum agendamento para este mês.
              </div>
            )}
            {(project.plannerData?.[new Date().getMonth().toString()] || []).length > 5 && (
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>
                + {(project.plannerData?.[new Date().getMonth().toString()] || []).length - 5} outros agendamentos
              </div>
            )}
          </div>
        </div>
      ) : project.type === 'SHOPPING' ? (
        <div style={{ backgroundColor: '#fff7ed', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #ffedd5' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9a3412', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Controlo de Compras</span>
            <span>{(() => {
              const items = (project.shoppingData || {})[isGlobalView ? ALL_STORES[0] : store] || [];
              const purchased = items.filter(i => i.isPurchased).length;
              return `${purchased}/${items.length} Itens`;
            })()}</span>
          </h4>
          
          {isGlobalView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {allStores.map(s => {
                const items = (project.shoppingData || {})[s] || [];
                const total = items.reduce((acc, i) => acc + (i.quantity * i.pricePerBox), 0);
                const progress = items.length > 0 ? Math.round((items.filter(i => i.isPurchased).length / items.length) * 100) : 0;
                
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>{s}</span>
                      <span style={{ fontSize: '0.65rem', color: '#9a3412', fontWeight: 600 }}>({progress}%)</span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#9a3412' }}>{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                  </div>
                );
              })}
            </div>
          ) : (() => {
            const items = (project.shoppingData || {})[store] || [];
            const total = items.reduce((acc, i) => acc + (i.quantity * i.pricePerBox), 0);
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Total Estimado</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>PROGRESSO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-color)' }}>{currentProgress}%</div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : project.type === 'WORKSPACE' ? null : (
        isGlobalView ? (
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Comparativo entre Lojas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               {allStores.map(s => {
                const p = getProgress(project.id, s);
                const below40 = project.type === 'MATRIX' ? getStoreRows(project.id, s).filter(r => (r.hours || 0) < 40).length : 0;
                
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s}
                      </span>
                      {project.type === 'MATRIX' && below40 > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 900 }}>
                          {below40}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', backgroundColor: p === 100 ? 'var(--success-color)' : 'var(--primary-color)', 
                        width: `${p}%`, transition: 'width 0.4s ease-out' 
                      }} />
                    </div>
                    <span style={{ width: '35px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', textAlign: 'right' }}>
                      {p}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Progresso: {store}</span>
                 {project.type === 'MATRIX' && (() => {
                   const count = getStoreRows(project.id, store).filter(r => (r.hours || 0) < 40).length;
                   return count > 0 ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#fef2f2', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                       <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>{count} PENDENTES (&lt; 40h)</span>
                     </div>
                   ) : null;
                 })()}
               </div>
               <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-color)' }}>{currentProgress}%</span>
            </div>
            <div style={{ height: '10px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', backgroundColor: currentProgress === 100 ? 'var(--success-color)' : 'var(--primary-color)', 
                width: `${currentProgress}%`, transition: 'width 0.5s ease-out'
              }} />
            </div>
          </div>
        )
      )}

      <button 
        onClick={() => onOpenDetail(project)}
        style={{ 
          marginTop: '0.5rem', width: '100%', padding: '0.85rem', background: 'var(--accent-dark)', color: 'var(--primary-color)',
          border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
        }}
      >
        <span>📂</span> Abrir Dashboard do Projeto
      </button>
    </div>
  );
}
