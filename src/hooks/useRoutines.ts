import { useState, useEffect, useCallback, useMemo } from 'react';
import { ALL_STORES, CustomTask, Area, RoutineExecution, Routine } from '@/types';
import { routines } from '@/data/routines';
import { isRoutineVisibleOn, formatDateKey } from '@/utils/routineUtils';
import { isCustomTaskVisibleOn } from '@/utils/recurrenceUtils';
import { pullFromCloud, pushToCloud } from '@/utils/syncUtils';

export interface OverdueRoutine extends Routine {
  originalDate: string;
}

export function useRoutines(activeDateStr: string) {
  const [routineDataByStore, setRoutineDataByStore] = useState<Record<string, Record<string, RoutineExecution>>>({});
  const [customTasksByStore, setCustomTasksByStore] = useState<Record<string, CustomTask[]>>({});
  
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [activeCustomDays, setActiveCustomDays] = useState<string[]>([]);
  const [overdueRoutinesByStore, setOverdueRoutinesByStore] = useState<Record<string, OverdueRoutine[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshActiveDays = useCallback(() => {
    const keys = Object.keys(localStorage);
    
    // Checklists Normais
    const routinesWithData = keys
      .filter(k => k.startsWith('routines_'))
      .map(k => k.replace('routines_', '').substring(0, 10)); // routines_YYYY-MM-DD_store -> YYYY-MM-DD
      
    // Custom tasks Ad-Hoc
    const customWithData = keys
      .filter(k => k.startsWith('customTasks_'))
      .filter(k => {
        try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            return parsed.length > 0;
        } catch(e) { return false; }
      })
      .map(k => k.replace('customTasks_', '').substring(0, 10));

    setActiveDays([...new Set(routinesWithData)]);
    setActiveCustomDays([...new Set(customWithData)]);
  }, []);

  useEffect(() => {
    // Sincronização Inteligente com a Nuvem
    const performSync = async () => {
      try {
        const { fullTwoWaySync } = await import('@/utils/syncUtils');
        await fullTwoWaySync();
      } catch (e) {
        console.error("Erro na sincronização inicial useRoutines:", e);
      }
    };
    performSync();
  }, []);

  useEffect(() => {
    const loadedData: Record<string, Record<string, RoutineExecution>> = {};
    const loadedCustom: Record<string, CustomTask[]> = {};
    
    ALL_STORES.forEach(store => {
      // Rotinas fixas (Complex Data)
      let storeRoutines: Record<string, RoutineExecution> = {};
      const storedData = localStorage.getItem(`routines_${activeDateStr}_${store}`);
      if (storedData) {
        try { 
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed)) {
            parsed.forEach(id => { storeRoutines[id] = { completed: true }; });
            localStorage.setItem(`routines_${activeDateStr}_${store}`, JSON.stringify(storeRoutines));
          } else {
            storeRoutines = parsed;
          }
        } 
        catch (e) { storeRoutines = {}; }
      }

      // Check for routines rescheduled TO this date
      const globalIdx = JSON.parse(localStorage.getItem('rescheduled_index') || '{}');
      const rescheduledToToday = globalIdx[store]?.[activeDateStr] || [];
      rescheduledToToday.forEach((item: any) => {
        if (!storeRoutines[item.id]) {
          storeRoutines[item.id] = { 
            completed: item.completed || false, 
            notes: item.notes || '',
            isRescheduled: true 
          };
        }
      });

      loadedData[store] = storeRoutines;

      // 2. Tarefas Extra (Manuais) - Combinação de Ad-hoc e Recorrentes
      const storedCustomInstances = localStorage.getItem(`customTasks_${activeDateStr}_${store}`);
      let instances: CustomTask[] = [];
      if (storedCustomInstances) {
        try { instances = JSON.parse(storedCustomInstances); } catch (e) { instances = []; }
      }

      // Carregar Definições (Recorrentes e Range Tasks)
      const storedDefinitions = localStorage.getItem(`custom_task_definitions_${store}`);
      let definitions: CustomTask[] = [];
      if (storedDefinitions) {
        try { definitions = JSON.parse(storedDefinitions); } catch (e) { definitions = []; }
      }

      // Filtrar definições que devem aparecer hoje
      const dateObj = new Date(activeDateStr);
      const recurringHere = definitions.filter(d => isCustomTaskVisibleOn(d, dateObj));

      const finalCustomForToday: CustomTask[] = [];
      const handledDefinitionIds = new Set<string>();

      // 1. Processar Definições (Recorrentes ou Range Tasks)
      // Deduplicar para evitar contagem dupla se houver definições sobrepostas com o mesmo ID
      const uniqueDefsMap = new Map<string, CustomTask>();
      recurringHere.forEach(def => {
        if (!uniqueDefsMap.has(def.id)) uniqueDefsMap.set(def.id, def);
      });

      uniqueDefsMap.forEach(def => {
        handledDefinitionIds.add(def.id);
        const existingInstance = instances.find(i => i.id === def.id);
        const isRangeTask = def.endDate && (!def.recurrence || def.recurrence === 'NONE');
        
        if (isRangeTask) {
          // Range tasks use the definition's state directly
          finalCustomForToday.push({ ...def });
        } else if (existingInstance) {
          // Recurring task with an override (completed/notes) for today
          finalCustomForToday.push({ ...def, ...existingInstance });
        } else {
          // Recurring task showing a fresh template for today
          finalCustomForToday.push({ ...def, isCompleted: false, notes: '' });
        }
      });

      // 2. Adicionar instâncias Ad-Hoc (que não vêm de definições)
      instances.forEach(instance => {
        if (!handledDefinitionIds.has(instance.id) && !instance.isRecurringDefinition) {
          finalCustomForToday.push(instance);
        }
      });

      loadedCustom[store] = finalCustomForToday;
    });

    setRoutineDataByStore(loadedData);
    setCustomTasksByStore(loadedCustom);

    // LÓGICA DE DETEÇÃO DE ATRASOS (Scan 7 dias)
    // Apenas se a data ativa for HOJE (ou se quisermos que apareça sempre, mas hoje é o pedido)
    const today = new Date();
    const todayStr = formatDateKey(today);
    
    if (activeDateStr === todayStr) {
      const overdueByStore: Record<string, OverdueRoutine[]> = {};
      
      ALL_STORES.forEach(store => {
        const storeOverdue: OverdueRoutine[] = [];
        
        // Percorrer os últimos 7 dias (excluindo hoje)
        for (let i = 1; i <= 7; i++) {
          const pastDate = new Date();
          pastDate.setDate(today.getDate() - i);
          const pastDateStr = formatDateKey(pastDate);
          
          // READE: Restrição da Ana - Apenas mostrar atrasos a partir de Segunda dia 13
          // Se o dia no passado for anterior a 2026-04-13, ignoramos
          if (pastDateStr < '2026-04-13') continue;

          // Carregar dados desse dia específico
          const pastDataRaw = localStorage.getItem(`routines_${pastDateStr}_${store}`);
          let pastData: Record<string, RoutineExecution> = {};
          if (pastDataRaw) {
            try { pastData = JSON.parse(pastDataRaw); } catch(e) {}
          }
          
          // Verificar rotinas que deveriam ter acontecido
          routines.forEach(r => {
            const isVisible = isRoutineVisibleOn(r, pastDate);
            const execution = pastData[r.id];
            
            // É atraso se: era visível AND (não completado AND não reagendado)
            if (isVisible && !execution?.completed && !execution?.rescheduledTo) {
              storeOverdue.push({
                ...r,
                originalDate: pastDateStr
              });
            }
          });
        }
        overdueByStore[store] = storeOverdue;
      });
      setOverdueRoutinesByStore(overdueByStore);
    } else {
      setOverdueRoutinesByStore({});
    }

    refreshActiveDays();
    setIsLoaded(true);
  }, [activeDateStr, refreshActiveDays]);

  const toggleRoutine = (id: string, store: string, dateOverride?: string) => {
    const targetDate = dateOverride || activeDateStr;
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setRoutineDataByStore((prev) => {
      const newPrev = { ...prev };
      
      storesToUpdate.forEach(targetStore => {
        const storeData = newPrev[targetStore] || {};
        const current = storeData[id];
        
        const updatedStoreData = { ...storeData };
        if (current?.completed) {
          updatedStoreData[id] = { ...current, completed: false };
        } else {
          updatedStoreData[id] = { ...current, completed: true };
        }
        
        const hasAnyData = Object.values(updatedStoreData).some(d => d.completed || d.notes);
        
        if (!hasAnyData) {
          localStorage.removeItem(`routines_${targetDate}_${targetStore}`);
          pushToCloud(`routines_${targetDate}_${targetStore}`, null); // Delete in cloud (simple implementation)
        } else {
          const value = JSON.stringify(updatedStoreData);
          localStorage.setItem(`routines_${targetDate}_${targetStore}`, value);
          pushToCloud(`routines_${targetDate}_${targetStore}`, value);
        }
        
        newPrev[targetStore] = updatedStoreData;
      });

      setTimeout(() => refreshActiveDays(), 10);

      if (dateOverride) {
         setTimeout(() => {
           setIsLoaded(false);
           setTimeout(() => setIsLoaded(true), 0);
         }, 100);
      }

      return newPrev;
    });
  };

  const hideRoutine = (id: string, store: string, dateOverride?: string) => {
    updateRoutineExecution(id, store, { isHidden: true }, dateOverride);
  };

  const updateRoutineExecution = (id: string, store: string, updates: Partial<RoutineExecution>, dateOverride?: string) => {
    const targetDate = dateOverride || activeDateStr;
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setRoutineDataByStore((prev) => {
      const newPrev = { ...prev };
      
      storesToUpdate.forEach(targetStore => {
        const storeData = newPrev[targetStore] || {};
        const current = storeData[id] || { completed: false };
        const updatedStoreData = { ...storeData, [id]: { ...current, ...updates } };
        const value = JSON.stringify(updatedStoreData);
        localStorage.setItem(`routines_${targetDate}_${targetStore}`, value);
        pushToCloud(`routines_${targetDate}_${targetStore}`, value);
        newPrev[targetStore] = updatedStoreData;
      });

      return newPrev;
    });
  };

  const updateRoutineNote = (id: string, store: string, notes: string, dateOverride?: string) => {
    updateRoutineExecution(id, store, { notes }, dateOverride);
  };

  const updateRoutineChecklist = (id: string, store: string, checklist: any[], dateOverride?: string) => {
    const targetDate = dateOverride || activeDateStr;
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setRoutineDataByStore((prev) => {
      const newPrev = { ...prev };
      storesToUpdate.forEach(targetStore => {
        const storeData = newPrev[targetStore] || {};
        const current = storeData[id] || { completed: false };
        const updatedStoreData = { ...storeData, [id]: { ...current, checklist } };
        const value = JSON.stringify(updatedStoreData);
        localStorage.setItem(`routines_${targetDate}_${targetStore}`, value);
        pushToCloud(`routines_${targetDate}_${targetStore}`, value);
        newPrev[targetStore] = updatedStoreData;
      });
      return newPrev;
    });
  };

  const addCustomTask = (
    title: string, 
    store: string, 
    area?: Area, 
    recurrence: any = 'NONE', 
    daysOfWeek?: number[], 
    dayOfMonth?: number,
    specificDate?: string,
    endDate?: string
  ) => {
    const isRange = endDate && endDate !== (specificDate || activeDateStr);
    const isRecurring = recurrence !== 'NONE' || isRange;
    const targetDate = specificDate || activeDateStr;
    const newTask: CustomTask = {
      id: `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      isCompleted: false,
      area,
      recurrence,
      daysOfWeek,
      dayOfMonth,
      startDate: targetDate, // Atribui a data alvo como início
      endDate,
      isRecurringDefinition: !!isRecurring
    };

    setCustomTasksByStore(prev => {
      const updated = { ...prev };
      const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];
      
      storesToUpdate.forEach(targetStore => {
        const currentData = localStorage.getItem(`customTasks_${targetDate}_${targetStore}`);
        const current = currentData ? JSON.parse(currentData) : [];
        const newStoreList = [...current, newTask];

        if (isRecurring) {
          const defsStr = localStorage.getItem(`custom_task_definitions_${targetStore}`);
          const defs = defsStr ? JSON.parse(defsStr) : [];
          const newValue = JSON.stringify([...defs, newTask]);
          localStorage.setItem(`custom_task_definitions_${targetStore}`, newValue);
          pushToCloud(`custom_task_definitions_${targetStore}`, newValue);
        } else {
          const newValue = JSON.stringify(newStoreList);
          localStorage.setItem(`customTasks_${targetDate}_${targetStore}`, newValue);
          pushToCloud(`customTasks_${targetDate}_${targetStore}`, newValue);
          updated[targetStore] = newStoreList;
        }
      });

      // Recarregar para refletir mudanças (especialmente se for recorrente e aparecer hoje)
      setTimeout(() => {
        refreshActiveDays();
        setIsLoaded(false);
        setTimeout(() => setIsLoaded(true), 10);
      }, 100);

      return updated;
    });
  };

  const toggleCustomTask = (id: string, store: string) => {
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setCustomTasksByStore(prev => {
      const newPrev = { ...prev };

      storesToUpdate.forEach(targetStore => {
        let current = [...(newPrev[targetStore] || [])];
        let targetTask = current.find(t => t.id === id);
        
        if (!targetTask) {
          // Busca um template em qualquer outra loja
          let template: CustomTask | undefined;
          Object.values(newPrev).some(list => {
            const found = list.find(t => t.id === id);
            if (found) template = found;
            return !!found;
          });
          
          if (!template) return;
          targetTask = { ...template, isCompleted: false, notes: '' };
          current.push(targetTask);
        }

        const updated = current.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
        newPrev[targetStore] = updated;

        const storedInstancesStr = localStorage.getItem(`customTasks_${activeDateStr}_${targetStore}`);
        let instances: CustomTask[] = storedInstancesStr ? JSON.parse(storedInstancesStr) : [];
        const existingIdx = instances.findIndex(i => i.id === id);
        const taskAfterToggle = updated.find(t => t.id === id)!;

        // If it's a range task with shared state, update the definition
        if (taskAfterToggle.endDate && (!taskAfterToggle.recurrence || taskAfterToggle.recurrence === 'NONE')) {
          const defsStr = localStorage.getItem(`custom_task_definitions_${targetStore}`);
          if (defsStr) {
            let defs = JSON.parse(defsStr);
            const val = JSON.stringify(defs);
            localStorage.setItem(`custom_task_definitions_${targetStore}`, val);
            pushToCloud(`custom_task_definitions_${targetStore}`, val);
          }
        } else {
          // Normal task or recurring task (per-day instance)
          if (existingIdx >= 0) {
            instances[existingIdx] = { ...instances[existingIdx], isCompleted: taskAfterToggle.isCompleted };
          } else {
            instances.push({ ...taskAfterToggle });
          }
          const newValue = JSON.stringify(instances);
          localStorage.setItem(`customTasks_${activeDateStr}_${targetStore}`, newValue);
          pushToCloud(`customTasks_${activeDateStr}_${targetStore}`, newValue);
        }
      });

      return newPrev;
    });
  };

  const updateCustomTask = (id: string, store: string, updates: Partial<CustomTask>) => {
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setCustomTasksByStore(prev => {
      const newPrev = { ...prev };

      storesToUpdate.forEach(targetStore => {
        let current = [...(newPrev[targetStore] || [])];
        let targetTask = current.find(t => t.id === id);
        
        if (!targetTask) {
          // Busca um template em qualquer outra loja
          let template: CustomTask | undefined;
          Object.values(newPrev).some(list => {
            const found = list.find(t => t.id === id);
            if (found) template = found;
            return !!found;
          });
          if (!template) return;
          targetTask = { ...template, isCompleted: false, notes: '' };
          current.push(targetTask);
        }

        const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
        newPrev[targetStore] = updated;

        const taskAfterUpdate = updated.find(t => t.id === id)!;

        // If it's a range task with shared state, update the definition's base fields too
        if (taskAfterUpdate.endDate && (!taskAfterUpdate.recurrence || taskAfterUpdate.recurrence === 'NONE')) {
           const defsStr = localStorage.getItem(`custom_task_definitions_${targetStore}`);
           if (defsStr) {
             let defs = JSON.parse(defsStr);
             const val = JSON.stringify(defs);
             localStorage.setItem(`custom_task_definitions_${targetStore}`, val);
             pushToCloud(`custom_task_definitions_${targetStore}`, val);
           }
        }

        if (taskAfterUpdate.isRecurringDefinition) {
          const defsStr = localStorage.getItem(`custom_task_definitions_${targetStore}`);
          if (defsStr) {
            let defs = JSON.parse(defsStr);
            defs = defs.map((d: any) => d.id === id ? { ...d, ...updates } : d);
            const val = JSON.stringify(defs);
            localStorage.setItem(`custom_task_definitions_${targetStore}`, val);
            pushToCloud(`custom_task_definitions_${targetStore}`, val);
          } else {
            // Se estamos atualizando uma definição recorrente que não existe na loja alvo, criamos o def
            const val = JSON.stringify([{...taskAfterUpdate}]);
            localStorage.setItem(`custom_task_definitions_${targetStore}`, val);
            pushToCloud(`custom_task_definitions_${targetStore}`, val);
          }
        }

        const storedInstancesStr = localStorage.getItem(`customTasks_${activeDateStr}_${targetStore}`);
        let instances: CustomTask[] = storedInstancesStr ? JSON.parse(storedInstancesStr) : [];
        const existingIdx = instances.findIndex(i => i.id === id);
        if (existingIdx >= 0) {
          instances[existingIdx] = { ...instances[existingIdx], ...updates };
        } else {
          instances.push({ ...taskAfterUpdate });
        }
        localStorage.setItem(`customTasks_${activeDateStr}_${targetStore}`, JSON.stringify(instances));
      });

      return newPrev;
    });
  };

  const deleteCustomTask = (id: string, store: string, dateOverride?: string) => {
    const targetDate = dateOverride || activeDateStr;
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setCustomTasksByStore(prev => {
      const newPrev = { ...prev };

      storesToUpdate.forEach(targetStore => {
        const current = newPrev[targetStore] || [];
        const taskToDelete = current.find(t => t.id === id);
        if (!taskToDelete) return;

        const updated = current.filter(t => t.id !== id);
        newPrev[targetStore] = updated;
        
        if (taskToDelete.isRecurringDefinition) {
          const defsStr = localStorage.getItem(`custom_task_definitions_${targetStore}`);
          if (defsStr) {
             let defs = JSON.parse(defsStr);
             const val = JSON.stringify(defs);
             localStorage.setItem(`custom_task_definitions_${targetStore}`, val);
             pushToCloud(`custom_task_definitions_${targetStore}`, val);
          }
        }
        
        // Always try to delete any instance for the targetDate if it exists, 
        // especially important if deleting a recurring definition that already created instances.
        const instancesStr = localStorage.getItem(`customTasks_${targetDate}_${targetStore}`);
        if (instancesStr) {
          const instances = JSON.parse(instancesStr);
          const filteredInstances = instances.filter((t: any) => t.id !== id);
          if (filteredInstances.length === 0) {
            localStorage.removeItem(`customTasks_${targetDate}_${targetStore}`);
          } else {
            localStorage.setItem(`customTasks_${targetDate}_${targetStore}`, JSON.stringify(filteredInstances));
          }
        }
      });

      setTimeout(() => refreshActiveDays(), 10);
      return newPrev;
    });
  };


  const rescheduleRoutine = (id: string, fromDateStr: string, toDateStr: string, store: string) => {
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setRoutineDataByStore(prev => {
      const newPrev = { ...prev };
      const globalIdxKey = 'rescheduled_index';
      const globalIdx = JSON.parse(localStorage.getItem(globalIdxKey) || '{}');

      storesToUpdate.forEach(targetStore => {
        const storeData = newPrev[targetStore] || {};
        const current = storeData[id] || { completed: false, notes: '' };

        const updatedStoreData = { ...storeData, [id]: { ...current, rescheduledTo: toDateStr } };
        const val = JSON.stringify(updatedStoreData);
        localStorage.setItem(`routines_${fromDateStr}_${targetStore}`, val);
        pushToCloud(`routines_${fromDateStr}_${targetStore}`, val);
        newPrev[targetStore] = updatedStoreData;

        if (!globalIdx[targetStore]) globalIdx[targetStore] = {};
        if (!globalIdx[targetStore][toDateStr]) globalIdx[targetStore][toDateStr] = [];
        globalIdx[targetStore][toDateStr] = globalIdx[targetStore][toDateStr].filter((item: any) => item.id !== id);
        globalIdx[targetStore][toDateStr].push({ 
          id, 
          fromDate: fromDateStr,
          notes: current.notes,
          completed: current.completed 
        });
      });

      const idxVal = JSON.stringify(globalIdx);
      localStorage.setItem(globalIdxKey, idxVal);
      pushToCloud(globalIdxKey, idxVal);
      setTimeout(() => refreshActiveDays(), 10);
      return newPrev;
    });
  };

  const rescheduleCustomTask = (id: string, fromDateStr: string, toDateStr: string, store: string) => {
    const storesToUpdate = store === 'Todas as Lojas' ? ALL_STORES : [store];

    setCustomTasksByStore(prev => {
      const newPrev = { ...prev };

      storesToUpdate.forEach(targetStore => {
        const currentTasks = newPrev[targetStore] || [];
        const taskToMove = currentTasks.find(t => t.id === id);
        if (!taskToMove) return;

        const updatedSource = currentTasks.filter(t => t.id !== id);
        const sourceVal = JSON.stringify(updatedSource);
        localStorage.setItem(`customTasks_${fromDateStr}_${targetStore}`, sourceVal);
        pushToCloud(`customTasks_${fromDateStr}_${targetStore}`, sourceVal);
        newPrev[targetStore] = updatedSource;

        const targetTasksStr = localStorage.getItem(`customTasks_${toDateStr}_${targetStore}`);
        const targetTasks = targetTasksStr ? JSON.parse(targetTasksStr) : [];
        const targetVal = JSON.stringify([...targetTasks, taskToMove]);
        localStorage.setItem(`customTasks_${toDateStr}_${targetStore}`, targetVal);
        pushToCloud(`customTasks_${toDateStr}_${targetStore}`, targetVal);
      });

      setTimeout(() => refreshActiveDays(), 10);
      return newPrev;
    });
  };

  const getProgress = (totalCategoryItems: number, completedCount: number) => {
    if (totalCategoryItems === 0) return 0;
    return Math.round((completedCount / totalCategoryItems) * 100);
  };

  return { 
    routineDataByStore, activeDays, toggleRoutine, updateRoutineNote, updateRoutineChecklist, rescheduleRoutine, rescheduleCustomTask, isLoaded, getProgress,
    customTasksByStore, addCustomTask, toggleCustomTask, updateCustomTask, deleteCustomTask, activeCustomDays,
    overdueRoutinesByStore, updateRoutineExecution, hideRoutine
  };
}
