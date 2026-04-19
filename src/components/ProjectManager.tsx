'use client';

import { useState } from 'react';
import { Area, ALL_STORES, Project, ProjectType } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { IBERSOL_INITIAL_TRAINING } from '@/constants/templates';

interface ProjectManagerProps {
  activeStore: string;
  allAreas: Area[];
  isGlobalView: boolean;
  allStores: readonly string[];
  getProgress: (projectId: string, store: string) => number;
  isTaskDone: (projectId: string, taskId: string, store: string) => boolean;
  isCellDone: (projectId: string, rowId: string, colId: string, store: string) => boolean;
  onOpenDetail: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  addProject: (title: string, area: Area, type: ProjectType, matrixConfig?: any) => void;
  projects: Project[];
  onRenameProject: (projectId: string, newTitle: string) => void;
  getStoreRows: (projectId: string, store: string) => any[];
  getStoreWorkspaceBlocks: (projectId: string, store: string) => any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
}


export function ProjectManager({ 
  activeStore, allAreas, isGlobalView, allStores, getProgress, isTaskDone, isCellDone, onOpenDetail, onDeleteProject, addProject, projects, onRenameProject, getStoreRows, getStoreWorkspaceBlocks,
  searchTerm, onSearchChange
}: ProjectManagerProps) {

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [selectedArea, setSelectedArea] = useState<Area | ''>('');
  const [projectType, setProjectType] = useState<ProjectType>('CHECKLIST');
  const [filterArea, setFilterArea] = useState<Area | 'Todas'>('Todas');
  const [useInitialTemplate, setUseInitialTemplate] = useState(false);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectTitle.trim() && selectedArea) {
      if (projectType === 'MATRIX') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'MATRIX', {
          columns: useInitialTemplate ? IBERSOL_INITIAL_TRAINING : [],
          rows: []
        });
      } else if (projectType === 'PLANNER') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'PLANNER');
      } else if (projectType === 'INCIDENTS') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'INCIDENTS');
      } else if (projectType === 'MAINTENANCE') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'MAINTENANCE');
      } else if (projectType === 'WORKSPACE') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'WORKSPACE');
      } else if (projectType === 'SHOPPING') {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'SHOPPING');
      } else {
        addProject(newProjectTitle.trim(), selectedArea as Area, 'CHECKLIST');
      }
      setNewProjectTitle('');
      setSelectedArea('');
      setUseInitialTemplate(false);
    }
  };

  const filteredProjects = projects.filter(p => filterArea === 'Todas' || p.area === filterArea);

  return (
    <div className="project-manager animate-fade">
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Criar Novo Projeto Estruturado</h2>
        <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="Título do projeto (ex: Remodelação de Balcão)"
            style={{ 
              flex: '2 1 300px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0',
              fontSize: '0.95rem', outline: 'none'
            }}
          />
          <select 
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value as Area | '')}
            style={{ 
              flex: '1 1 200px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0',
              fontSize: '0.95rem', outline: 'none', backgroundColor: 'white'
            }}
          >
            <option value="" disabled>-- Departamento --</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 100%', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tipo:</label>
                <select 
                  value={projectType} 
                  onChange={(e) => setProjectType(e.target.value as any)}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                 >
                  <option value="CHECKLIST">Lista de Tarefas</option>
                  <option value="MATRIX">Matriz (Formação)</option>
                  <option value="PLANNER">Calendário Mensal (Consultas)</option>
                  <option value="INCIDENTS">Incidentes (Orçamento)</option>
                  <option value="MAINTENANCE">Manutenções Necessárias (Histórico)</option>
                  <option value="WORKSPACE">Projeto Flexível (Workspace)</option>
                  <option value="SHOPPING">Lista de Compras (Custos/Qtd)</option>
                </select>
             </div>

             {projectType === 'MATRIX' && (
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 700 }}>
                 <input 
                   type="checkbox" 
                   checked={useInitialTemplate}
                   onChange={(e) => setUseInitialTemplate(e.target.checked)}
                 />
                 Carregar Plano de Formação Inicial (Ibersol)
               </label>
             )}
          </div>

          <button 
            type="submit"
            disabled={!newProjectTitle.trim() || !selectedArea}
            style={{ 
              marginTop: '0.5rem',
              padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-color)', color: 'white',
              border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
              opacity: (newProjectTitle.trim() && selectedArea) ? 1 : 0.5
            }}
          >
            Criar Projeto
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '2rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap' }}>
          {isGlobalView ? 'Projetos (Visão Consolidada)' : `Projetos Ativos em ${activeStore}`}
        </h2>

        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '1rem', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
            <input 
              type="text"
              placeholder="Pesquisar projetos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '0.75rem',
                border: '1px solid #e2e8f0', backgroundColor: 'white',
                fontSize: '0.9rem', color: 'var(--text-main)', outline: 'none',
                transition: 'all 0.2s',
                borderColor: searchTerm ? 'var(--primary-color)' : '#e2e8f0'
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
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Filtrar por Área:</span>
          <select 
             value={filterArea}
             onChange={(e) => setFilterArea(e.target.value as any)}
             style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="Todas">Todas as Áreas</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="project-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {filteredProjects.map(project => (
          <ProjectCard 
            key={project.id}
            project={project}
            store={activeStore}
            isGlobalView={isGlobalView}
            allStores={allStores}
            getProgress={getProgress}
            isTaskDone={isTaskDone}
            isCellDone={isCellDone}
            onOpenDetail={onOpenDetail}
            onDeleteProject={onDeleteProject}
            onRenameProject={onRenameProject}
            getStoreRows={getStoreRows}
            getStoreWorkspaceBlocks={getStoreWorkspaceBlocks}
          />
        ))}
        {filteredProjects.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc',
            borderRadius: '1rem', border: '2px dashed #e2e8f0', color: '#94a3b8'
          }}>
            Nenhum projeto encontrado para esta seleção.
          </div>
        )}
      </div>
    </div>
  );
}
