import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask, ProjectExecution, Area, ALL_STORES, MatrixRow, MaintenanceIncident, MaintenanceTask, ShoppingItem, ProjectType } from '@/types';
import { pushToCloud, pullFromCloud } from '@/utils/syncUtils';
import { IBERSOL_INITIAL_TRAINING } from '@/constants/templates';

export function useProjects(activeStore: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [executions, setExecutions] = useState<Record<string, ProjectExecution[]>>({});
  const [today, setToday] = useState<Date | null>(null);

  // Sincronização Inteligente com a Nuvem
  useEffect(() => {
    const performSync = async () => {
      try {
        const { fullTwoWaySync } = await import('@/utils/syncUtils');
        await fullTwoWaySync();
      } catch (e) {
        console.error("Erro na sincronização inicial:", e);
      }
    };
    performSync();
  }, []);

  useEffect(() => {
    const now = new Date();
    setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    const storedProjects = localStorage.getItem('projects_global');
    if (storedProjects) {
      try { 
        const parsed = JSON.parse(storedProjects);
        let changed = false;
        let renamed = parsed.map((p: Project) => {
          if (p.id === 'proj_seed_formacao' && p.title === 'Formação de Excelência 2026') {
            changed = true;
            return { ...p, title: 'Formações 2026' };
          }
          return p;
        });

        // --- MIGRAÇÃO: Injetar Projeto de Entrevistas se não existir ---
        if (!renamed.find((p: any) => p.id === 'proj_gestao_entrevistas')) {
          const interviewProject: Project = {
            id: 'proj_gestao_entrevistas',
            title: 'Gestão de Entrevistas de Emprego',
            area: 'Recursos Humanos (Pessoas)',
            type: 'WORKSPACE',
            status: 'Active',
            tasks: [],
            workspaceBlocks: [
              {
                id: 'ent_block_candidatos',
                type: 'TABLE',
                title: 'Lista de Candidatos',
                table: {
                  headers: ['Nome', 'Telefone', 'Cargo Interessado', 'Avaliação'],
                  rows: [['', '', '', '']]
                }
              },
              {
                id: 'ent_block_checklist',
                type: 'CHECKLIST',
                title: 'Guião / Checklist de Entrevista',
                checklist: [
                  { id: 'ec_1', text: 'Apresentação e Experiência', isDone: false },
                  { id: 'ec_2', text: 'Disponibilidade de Horários', isDone: false },
                  { id: 'ec_3', text: 'Capacidade de Trabalho em Equipa', isDone: false },
                  { id: 'ec_4', text: 'Simpatia e Comunicação', isDone: false },
                  { id: 'ec_5', text: 'Feedback Final', isDone: false }
                ]
              },
              {
                id: 'ent_block_notas',
                type: 'TEXT',
                title: 'Observações Finais',
                content: '<p>Utilize este espaço para notas detalhadas sobre o perfil dos candidatos...</p>'
              }
            ],
            createdAt: Date.now()
          };
          renamed.push(interviewProject);
          changed = true;
        }

        console.log("Agenda: Projetos carregados:", renamed.length);
        setProjects(renamed);
        
        // Só persistir se houve mudança (migração)
        if (changed) {
          localStorage.setItem('projects_global', JSON.stringify(renamed));
          pushToCloud('projects_global', JSON.stringify(renamed));
        }
      } catch(e) { setProjects([]); }
    } else {
      const initialProjects: Project[] = [
        {
          id: 'proj_seed_formacao',
          title: 'Formações 2026',
          area: 'Recursos Humanos (Pessoas)',
          type: 'MATRIX',
          status: 'Active',
          tasks: [],
          matrixConfig: {
            columns: [
              "Improving REST 1ª Ed 2025",
              "A Arte de Dar e Receber Feedback",
              "A Arte de Trabalhar em Equipa",
              "Serviço ao cliente com Excelência",
              "A Arte de Construir Pontes",
              "A Arte de Lidar com o Stress",
              "Recertificação em SST 2026"
            ],
            rows: []
          },
          createdAt: Date.now()
        },
        {
          id: 'proj_initial_training',
          title: 'Formações 2026',
          area: 'Recursos Humanos (Pessoas)',
          type: 'MATRIX',
          status: 'Active',
          tasks: [],
          matrixConfig: {
            columns: IBERSOL_INITIAL_TRAINING,
            rows: [],
            isTransposed: true
          },
          createdAt: Date.now() + 1
        },
        {
          id: 'proj_consultas_medicas',
          title: 'Controlo de Consultas Médicas 2026',
          area: 'Recursos Humanos (Pessoas)',
          type: 'PLANNER',
          status: 'Active',
          tasks: [],
          plannerData: {
            '5': [
              { id: '1', name: 'Alexandre Correia', store: 'VPN', date: '19/06/2026', month: 5, year: 2026 }
            ],
            '8': [
              { id: '2', name: 'Rosa Pina', store: 'Vagos Sul', date: '30/09/2026', month: 8, year: 2026 }
            ],
            '9': [
              { id: '3', name: 'Marta Pinto', store: 'VPN', date: '28/10/2026', month: 9, year: 2026 },
              { id: '4', name: 'Cristina', store: 'Ovar Norte', date: '07/10/2026', month: 9, year: 2026 }
            ],
            '10': [
              { id: '5', name: 'Sara', store: 'Ovar Norte', date: '03/11/2026', month: 10, year: 2026 }
            ],
            '11': [
              { id: '6', name: 'William', store: 'Vagos Sul', date: '13/12/2026', month: 11, year: 2026 },
              { id: '7', name: 'Rodrigo Mardegan', store: 'Vagos Sul', date: '17/12/2026', month: 11, year: 2026 },
              { id: '8', name: 'Tatiana Mardegan', store: 'Vagos Norte', date: '17/12/2026', month: 11, year: 2026 }
            ]
          },
          projectNotes: 'Mariana / Monica / Tiago/ Carina/ Eduardo só em 2027\nJoana /Bruna/Samuel / Ana Neves/Yasmilet/Ana pires só em 2027\nKarina só em 2028',
          createdAt: Date.now() + 2
        },
        {
          id: 'proj_gestao_entrevistas',
          title: 'Gestão de Entrevistas de Emprego',
          area: 'Recursos Humanos (Pessoas)',
          type: 'WORKSPACE',
          status: 'Active',
          tasks: [],
          workspaceBlocks: [
            {
              id: 'ent_block_candidatos',
              type: 'TABLE',
              title: 'Lista de Candidatos',
              table: {
                headers: ['Nome', 'Telefone', 'Cargo Interessado', 'Avaliação'],
                rows: [['', '', '', '']]
              }
            },
            {
              id: 'ent_block_checklist',
              type: 'CHECKLIST',
              title: 'Guião / Checklist de Entrevista',
              checklist: [
                { id: 'ec_1', text: 'Apresentação e Experiência', isDone: false },
                { id: 'ec_2', text: 'Disponibilidade de Horários', isDone: false },
                { id: 'ec_3', text: 'Capacidade de Trabalho em Equipa', isDone: false },
                { id: 'ec_4', text: 'Simpatia e Comunicação', isDone: false },
                { id: 'ec_5', text: 'Feedback Final', isDone: false }
              ]
            },
            {
              id: 'ent_block_notas',
              type: 'TEXT',
              title: 'Observações Finais',
              content: '<p>Utilize este espaço para notas detalhadas sobre o perfil dos candidatos...</p>'
            }
          ],
          createdAt: Date.now() + 3
        }
      ];
      setProjects(initialProjects);
      localStorage.setItem('projects_global', JSON.stringify(initialProjects));
    }

    const storedExecutions: Record<string, ProjectExecution[]> = {};
    ALL_STORES.forEach(s => {
      const data = localStorage.getItem(`project_executions_${s}`);
      if (data) {
        try { storedExecutions[s] = JSON.parse(data); } catch(e) { storedExecutions[s] = []; }
      } else {
        // Seed para Vagos Norte com nomes da foto
        if (s === 'Vagos Norte') {
          const seedRows: MatrixRow[] = [
            { id: 'v_ana', name: 'Ana Cristina Marques das Neves', hours: 2 },
            { id: 'v_bruna', name: 'Bruna Alexandra Midoes de Sousa', hours: 9 },
            { id: 'v_joana', name: 'Joana Filipa Alemida Ferreira', hours: 6 },
            { id: 'v_rodrigo', name: 'Rodrigo Rodrigues Mardegan' },
            { id: 'v_samuel', name: 'Samuel Martins Ferreira Jesus', hours: 16 }
          ];
          const seedExec: ProjectExecution = {
            projectId: 'proj_seed_formacao',
            store: 'Vagos Norte',
            completedTaskIds: [],
            matrixData: { 'v_ana-A Arte de Dar e Receber Feedback': true, 'v_bruna-Improving REST 1ª Ed 2025': true },
            matrixRows: seedRows
          };
          storedExecutions[s] = [seedExec];
          localStorage.setItem(`project_executions_${s}`, JSON.stringify([seedExec]));
        } else {
          storedExecutions[s] = [];
        }
      }
    });
    setExecutions(storedExecutions);
  }, []);

  // Função interna para persistir sem duplicar o setProjects se já estivermos num loop de atualização
  const persistProjects = (updatedProjects: Project[]) => {
    const val = JSON.stringify(updatedProjects);
    localStorage.setItem('projects_global', val);
    pushToCloud('projects_global', val);
  };

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    persistProjects(newProjects);
  };

  const persistExecutions = (store: string, storeExecs: ProjectExecution[]) => {
    const val = JSON.stringify(storeExecs);
    localStorage.setItem(`project_executions_${store}`, val);
    pushToCloud(`project_executions_${store}`, val);
  };

  const saveExecutions = (store: string, storeExecs: ProjectExecution[]) => {
    setExecutions(prev => {
      const updated = { ...prev, [store]: storeExecs };
      persistExecutions(store, storeExecs);
      return updated;
    });
  };

  const addProject = (title: string, area: Area, type: ProjectType, matrixConfig?: { columns: string[], rows: MatrixRow[], isTransposed?: boolean }) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title,
      area,
      type,
      status: 'Active',
      tasks: [],
      matrixConfig,
      createdAt: Date.now()
    };
    
    setProjects(prev => {
      const newProjects = [...prev, newProject];
      const val = JSON.stringify(newProjects);
      localStorage.setItem('projects_global', val);
      pushToCloud('projects_global', val);
      return newProjects;
    });
  };

  const deleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
    // Opcional: Limpar execuções de todas as lojas
    ALL_STORES.forEach(s => {
      const storeExecs = executions[s] || [];
      const updated = storeExecs.filter(e => e.projectId !== id);
      saveExecutions(s, updated);
    });
  };

  const addTaskToProject = (projectId: string, text: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const newTask: ProjectTask = { id: `pt_${Date.now()}`, text, isDone: false };
          return { ...p, tasks: [...p.tasks, newTask] };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const removeTaskFromProject = (projectId: string, taskId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const toggleTaskExecution = (projectId: string, taskId: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      
      if (!exec) {
        exec = { projectId, store, completedTaskIds: [] };
        storeExecs.push(exec);
      }

      if (exec.completedTaskIds.includes(taskId)) {
        exec.completedTaskIds = exec.completedTaskIds.filter(id => id !== taskId);
      } else {
        exec.completedTaskIds.push(taskId);
      }

      persistExecutions(store, storeExecs);
      return { ...prev, [store]: storeExecs };
    });
  };

  const updateMatrixCell = (projectId: string, rowId: string, colId: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      
      if (!exec) {
        exec = { projectId, store, completedTaskIds: [], matrixData: {}, matrixRows: [] };
        storeExecs.push(exec);
      }

      const matrixData = { ...(exec.matrixData || {}) };
      const key = `${rowId}-${colId}`;
      matrixData[key] = !matrixData[key];
      
      exec.matrixData = matrixData;
      persistExecutions(store, storeExecs);
      return { ...prev, [store]: storeExecs };
    });
  };

  const addMatrixRow = (projectId: string, name: string, store: string, hours?: number) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      
      if (!exec) {
        exec = { projectId, store, completedTaskIds: [], matrixData: {}, matrixRows: [] };
        storeExecs.push(exec);
      }

      const newRow = { id: `row_${Date.now()}`, name, hours };
      exec.matrixRows = [...(exec.matrixRows || []), newRow];
      
      persistExecutions(store, storeExecs);
      return { ...prev, [store]: storeExecs };
    });
  };

  const deleteMatrixRow = (projectId: string, rowId: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      if (exec && exec.matrixRows) {
        exec.matrixRows = exec.matrixRows.filter(r => r.id !== rowId);
        const newMatrixData = { ...(exec.matrixData || {}) };
        Object.keys(newMatrixData).forEach(key => {
          if (key.startsWith(`${rowId}-`)) delete newMatrixData[key];
        });
        exec.matrixData = newMatrixData;
        persistExecutions(store, storeExecs);
      }
      return { ...prev, [store]: storeExecs };
    });
  };

  const updateMatrixRowHours = (projectId: string, rowId: string, store: string, hours: number) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      if (exec && exec.matrixRows) {
        exec.matrixRows = exec.matrixRows.map(r => 
          r.id === rowId ? { ...r, hours } : r
        );
        persistExecutions(store, storeExecs);
      }
      return { ...prev, [store]: storeExecs };
    });
  };

  const addMatrixColumn = (projectId: string, columnName: string) => {
    if (!columnName.trim()) return;
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const currentConfig = p.matrixConfig || { columns: [], rows: [] };
          return { 
            ...p, 
            matrixConfig: { ...currentConfig, columns: [...currentConfig.columns, columnName.trim()] }
          };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const deleteMatrixColumn = (projectId: string, colName: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId && p.matrixConfig) {
          return { 
            ...p, 
            matrixConfig: { 
              ...p.matrixConfig, 
              columns: p.matrixConfig.columns.filter(c => c !== colName) 
            } 
          };
        }
        return p;
      });
      persistProjects(updated);
      return updated;
    });

    // Opcional: Limpar dados da célula em todas as execuções
    setExecutions(prev => {
      const newExecutions = { ...prev };
      ALL_STORES.forEach(s => {
        const storeExecs = [...(newExecutions[s] || [])];
        let exec = storeExecs.find(e => e.projectId === projectId);
        if (exec && exec.matrixData) {
          const newData = { ...exec.matrixData };
          Object.keys(newData).forEach(key => {
            if (key.endsWith(`-${colName}`)) delete newData[key];
          });
          exec.matrixData = newData;
          persistExecutions(s, storeExecs);
        }
        newExecutions[s] = storeExecs;
      });
      return newExecutions;
    });
  };

  const toggleMatrixTranspose = (projectId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId && p.matrixConfig) {
          return { 
            ...p, 
            matrixConfig: { 
              ...p.matrixConfig, 
              isTransposed: !p.matrixConfig.isTransposed 
            } 
          };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const renameProject = (projectId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return { ...p, title: newTitle.trim() };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const updatePlannerEntries = (projectId: string, month: number, entries: any[]) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          const currentData = p.plannerData || {};
          return { 
            ...p, 
            plannerData: { ...currentData, [month]: entries }
          };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  const updateProjectNotes = (projectId: string, notes: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return { ...p, projectNotes: notes };
        }
        return p;
      });
      saveProjects(updated);
      return updated;
    });
  };

  // --- INCIDENTS ---

  const addIncident = (projectId: string, incident: Omit<MaintenanceIncident, 'id'>) => {
    const key = `${incident.store}||${incident.yearMonth}`;
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.incidentData || {};
        const list = current[key] || [];
        const newIncident: MaintenanceIncident = { ...incident, id: `inc_${Date.now()}` };
        return { ...p, incidentData: { ...current, [key]: [...list, newIncident] } };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const updateIncident = (projectId: string, incidentId: string, data: Partial<MaintenanceIncident>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const newData: Record<string, MaintenanceIncident[]> = {};
        Object.entries(p.incidentData || {}).forEach(([key, list]) => {
          newData[key] = list.map(inc => inc.id === incidentId ? { ...inc, ...data } : inc);
        });
        return { ...p, incidentData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const deleteIncident = (projectId: string, incidentId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const newData: Record<string, MaintenanceIncident[]> = {};
        Object.entries(p.incidentData || {}).forEach(([key, list]) => {
          newData[key] = list.filter(inc => inc.id !== incidentId);
        });
        return { ...p, incidentData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const setIncidentBudget = (projectId: string, store: string, annualBudget: number) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const budgets = p.incidentBudgets || {};
        return { ...p, incidentBudgets: { ...budgets, [store]: annualBudget } };
      });
      saveProjects(updated);
      return updated;
    });
  };

  // --- MAINTENANCE (Continuous Tracker) ---

  const addMaintenanceTask = (projectId: string, task: Omit<MaintenanceTask, 'id'>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.maintenanceData || {};
        const list = current[task.store] || [];
        const newTask: MaintenanceTask = { ...task, id: `maint_${Date.now()}` };
        return { ...p, maintenanceData: { ...current, [task.store]: [...list, newTask] } };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const updateMaintenanceTask = (projectId: string, taskId: string, updates: Partial<MaintenanceTask>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.maintenanceData || {};
        const newData: Record<string, MaintenanceTask[]> = {};
        Object.entries(current).forEach(([store, list]) => {
          newData[store] = list.map(t => t.id === taskId ? { ...t, ...updates } : t);
        });
        return { ...p, maintenanceData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const deleteMaintenanceTask = (projectId: string, taskId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.maintenanceData || {};
        const newData: Record<string, MaintenanceTask[]> = {};
        Object.entries(current).forEach(([store, list]) => {
          newData[store] = list.filter(t => t.id !== taskId);
        });
        return { ...p, maintenanceData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  // --- WORKSPACE (Individual por Loja) ---
  const addWorkspaceBlock = (projectId: string, type: any, title: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      
      if (!exec) {
        exec = { projectId, store, completedTaskIds: [], workspaceBlocks: [] };
        storeExecs.push(exec);
      }

      const currentBlocks = exec.workspaceBlocks || [];
      const newBlock = { 
        id: `block_${Date.now()}`, 
        type, 
        title,
        checklist: type === 'CHECKLIST' ? [] : undefined,
        table: type === 'TABLE' ? { headers: ['Coluna 1'], rows: [['']] } : undefined,
        media: type === 'MEDIA' ? [] : undefined,
        content: type === 'TEXT' ? '<p>Novo bloco de texto...</p>' : ''
      };
      
      exec.workspaceBlocks = [...currentBlocks, newBlock];
      persistExecutions(store, storeExecs);
      return { ...prev, [store]: storeExecs };
    });
  };

  const updateWorkspaceBlock = (projectId: string, blockId: string, updates: any, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      if (exec && exec.workspaceBlocks) {
        exec.workspaceBlocks = exec.workspaceBlocks.map(b => 
          b.id === blockId ? { ...b, ...updates } : b
        );
        persistExecutions(store, storeExecs);
      }
      return { ...prev, [store]: storeExecs };
    });
  };

  const deleteWorkspaceBlock = (projectId: string, blockId: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      if (exec && exec.workspaceBlocks) {
        exec.workspaceBlocks = exec.workspaceBlocks.filter(b => b.id !== blockId);
        persistExecutions(store, storeExecs);
      }
      return { ...prev, [store]: storeExecs };
    });
  };

  const toggleWorkspaceTask = (projectId: string, blockId: string, taskId: string, store: string) => {
    setExecutions(prev => {
      const storeExecs = [...(prev[store] || [])];
      let exec = storeExecs.find(e => e.projectId === projectId);
      if (exec && exec.workspaceBlocks) {
        exec.workspaceBlocks = exec.workspaceBlocks.map(b => {
          if (b.id !== blockId || !b.checklist) return b;
          return {
            ...b,
            checklist: b.checklist.map(t => t.id === taskId ? { ...t, isDone: !t.isDone } : t)
          };
        });
        persistExecutions(store, storeExecs);
      }
      return { ...prev, [store]: storeExecs };
    });
  };

  // --- SHOPPING ---

  const addShoppingItem = (projectId: string, item: Omit<ShoppingItem, 'id'>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.shoppingData || {};
        const list = current[item.store] || [];
        const newItem: ShoppingItem = { ...item, id: `shop_${Date.now()}` };
        return { ...p, shoppingData: { ...current, [item.store]: [...list, newItem] } };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const updateShoppingItem = (projectId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.shoppingData || {};
        const newData: Record<string, ShoppingItem[]> = {};
        Object.entries(current || {}).forEach(([store, list]) => {
          newData[store] = list.map(t => t.id === itemId ? { ...t, ...updates } : t);
        });
        return { ...p, shoppingData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const deleteShoppingItem = (projectId: string, itemId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const current = p.shoppingData || {};
        const newData: Record<string, ShoppingItem[]> = {};
        Object.entries(current || {}).forEach(([store, list]) => {
          newData[store] = list.filter(t => t.id !== itemId);
        });
        return { ...p, shoppingData: newData };
      });
      saveProjects(updated);
      return updated;
    });
  };

  const getProjectProgress = (projectId: string, store: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    const exec = (executions[store] || []).find(e => e.projectId === projectId);
    if (!exec) return 0;

    if (project.type === 'CHECKLIST') {
      if (project.tasks.length === 0) return 0;
      return Math.round((exec.completedTaskIds.length / project.tasks.length) * 100);
    } else if (project.type === 'WORKSPACE') {
      const allChecklists = exec.workspaceBlocks?.filter(b => b.type === 'CHECKLIST') || [];
      let total = 0;
      let done = 0;
      allChecklists.forEach(b => {
        total += b.checklist?.length || 0;
        done += b.checklist?.filter(t => t.isDone).length || 0;
      });
      if (total === 0) return 0;
      return Math.round((done / total) * 100);
    } else if (project.type === 'SHOPPING') {
      const list = (project.shoppingData || {})[store] || [];
      if (list.length === 0) return 0;
      const done = list.filter(i => i.isPurchased).length;
      return Math.round((done / list.length) * 100);
    } else {
      const storeRows = exec.matrixRows || [];
      if (!project.matrixConfig || storeRows.length === 0 || project.matrixConfig.columns.length === 0) return 0;
      const totalCells = storeRows.length * project.matrixConfig.columns.length;
      const doneCells = Object.values(exec.matrixData || {}).filter(v => v === true).length;
      return Math.round((doneCells / totalCells) * 100);
    }
  };

  const isTaskDone = (projectId: string, taskId: string, store: string) => {
    const exec = (executions[store] || []).find(e => e.projectId === projectId);
    return exec ? exec.completedTaskIds.includes(taskId) : false;
  };

  const isMatrixCellDone = (projectId: string, rowId: string, colId: string, store: string) => {
    const exec = (executions[store] || []).find(e => e.projectId === projectId);
    return exec?.matrixData?.[`${rowId}-${colId}`] || false;
  };

  return {
    projects,
    executions,
    addProject,
    deleteProject,
    addTaskToProject,
    removeTaskFromProject,
    toggleTaskExecution,
    updateMatrixCell,
    addMatrixRow,
    addMatrixColumn,
    deleteMatrixColumn,
    deleteMatrixRow,
    updateMatrixRowHours,
    getProjectProgress,
    isTaskDone,
    isMatrixCellDone,
    toggleMatrixTranspose,
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
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    getStoreMatrixRows: (pId: string, store: string) => {
      const exec = (executions[store] || []).find(e => e.projectId === pId);
      return exec?.matrixRows || [];
    },
    getStoreWorkspaceBlocks: (pId: string, store: string) => {
      const exec = (executions[store] || []).find(e => e.projectId === pId);
      return exec?.workspaceBlocks || [];
    }
  };
}
