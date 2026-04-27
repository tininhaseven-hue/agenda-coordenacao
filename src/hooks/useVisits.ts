import { useState, useEffect } from 'react';
import { Visit, VisitType, Store, VisitChecklistItem } from '@/types';
import { getChecklistForType } from '@/data/visitTemplates';

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sincronização Inteligente com a Nuvem
    const performSync = async () => {
      try {
        const { fullTwoWaySync } = await import('@/utils/syncUtils');
        await fullTwoWaySync();
      } catch (e) {
        console.error("Erro na sincronização inicial useVisits:", e);
      }
    };
    performSync();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('visitas_agenda');
    if (stored) {
      try {
        setVisits(JSON.parse(stored));
      } catch (e) {
        setVisits([]);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveVisits = (newVisits: Visit[]) => {
    setVisits(newVisits);
    const val = JSON.stringify(newVisits);
    localStorage.setItem('visitas_agenda', val);
    
    // PUSH to cloud
    import('@/utils/syncUtils').then(mod => {
      mod.pushToCloud('visitas_agenda', val);
    });
  };

  const addVisit = (store: Store, date: string, type: VisitType, accompaniment: string, objective: string) => {
    const newVisit: Visit = {
      id: `vst_${Date.now()}`,
      store,
      date,
      type,
      accompaniment,
      objective,
      notes: '',
      status: 'PLANEADA',
      checklist: getChecklistForType(type),
      createdAt: Date.now()
    };
    saveVisits([newVisit, ...visits]);
    return newVisit;
  };

  const updateVisit = (id: string, updates: Partial<Visit>) => {
    const updated = visits.map(v => v.id === id ? { ...v, ...updates } : v);
    saveVisits(updated);
  };

  const deleteVisit = (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este registo de visita?')) {
      const updated = visits.filter(v => v.id !== id);
      saveVisits(updated);
    }
  };

  const updateChecklistItem = (visitId: string, itemId: string, updates: Partial<VisitChecklistItem>) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const newChecklist = v.checklist.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        );
        return { ...v, checklist: newChecklist };
      }
      return v;
    });
    saveVisits(updated);
  };

  const deleteChecklistItem = (visitId: string, itemId: string) => {
    const updated = visits.map(v => {
      if (v.id === visitId) {
        const newChecklist = v.checklist.filter(item => item.id !== itemId);
        return { ...v, checklist: newChecklist };
      }
      return v;
    });
    saveVisits(updated);
  };

  const addChecklistItem = (visitId: string, text: string) => {
    const newItem: VisitChecklistItem = {
      id: crypto.randomUUID(),
      text,
      status: 'PENDENTE',
      observations: ''
    };
    
    const updated = visits.map(v => {
      if (v.id === visitId) {
        return { ...v, checklist: [...v.checklist, newItem] };
      }
      return v;
    });
    saveVisits(updated);
  };

  return {
    visits,
    isLoaded,
    addVisit,
    updateVisit,
    deleteVisit,
    updateChecklistItem,
    deleteChecklistItem,
    addChecklistItem
  };
}
