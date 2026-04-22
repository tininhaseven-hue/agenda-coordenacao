'use client';

import { Project, MatrixRow, ALL_STORES } from '@/types';
import { useMemo } from 'react';

interface RegionalDashboardProps {
  projects: Project[];
  isCellDone: (projectId: string, rowId: string, colId: string, store: string) => boolean;
}

export function RegionalDashboard({ projects, isCellDone }: RegionalDashboardProps) {
  const stats = useMemo(() => {
    let totalMaintenanceSpent = 0;
    let totalIncidentSpent = 0;
    let pendingIncidents = 0;
    let totalShoppingValue = 0;
    let totalMatrixCells = 0;
    let completedMatrixCells = 0;

    projects.forEach(p => {
      // 1. Manutenções (History)
      if (p.type === 'MAINTENANCE' && p.maintenanceData) {
        Object.values(p.maintenanceData).forEach(tasks => {
          tasks.forEach(t => {
            if (!t.isHidden) totalMaintenanceSpent += t.amountPaid;
          });
        });
      }

      // 2. Incidentes
      if (p.type === 'INCIDENTS' && p.incidentData) {
        Object.values(p.incidentData).forEach(incs => {
          incs.forEach(inc => {
            if (!inc.isHidden) {
              totalIncidentSpent += inc.costExVat;
              if (!inc.approvalDate) pendingIncidents++;
            }
          });
        });
      }

      // 3. Shopping
      if (p.type === 'SHOPPING' && p.shoppingData) {
        Object.values(p.shoppingData).forEach(items => {
          items.forEach(item => {
            if (!item.isHidden && !item.isPurchased) {
              totalShoppingValue += (item.quantity * item.pricePerBox);
            }
          });
        });
      }

      // 4. Matrix (Training Progress)
      if (p.type === 'MATRIX' && p.matrixConfig) {
        const cols = p.matrixConfig.columns;
        const rows = p.matrixConfig.rows;
        
        ALL_STORES.forEach(s => {
          rows.forEach(r => {
            cols.forEach(c => {
              totalMatrixCells++;
              if (isCellDone(p.id, r.id, c, s)) {
                completedMatrixCells++;
              }
            });
          });
        });
      }
    });

    const matrixProgress = totalMatrixCells > 0 ? Math.round((completedMatrixCells / totalMatrixCells) * 100) : 0;

    return {
      totalSpent: totalMaintenanceSpent + totalIncidentSpent,
      pendingIncidents,
      shoppingValue: totalShoppingValue,
      storeCount: ALL_STORES.length,
      matrixProgress
    };
  }, [projects, isCellDone]);

  return (
    <div className="regional-dashboard animate-fade-in">
      <div className="dashboard-header">
        <div className="title-area">
          <span className="badge">REGIONAL</span>
          <h2>Resumo Executivo <span className="ana-text">ANA</span></h2>
        </div>
        <div className="date-badge">{new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💶</div>
          <div className="stat-info">
            <label>Investimento Manutenção</label>
            <div className="value">{stats.totalSpent.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            <div className="sub-value">Total acumulado na região</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <label>Incidentes Pendentes</label>
            <div className="value">{stats.pendingIncidents}</div>
            <div className="sub-value">A aguardar aprovação/resolução</div>
          </div>
        </div>

        <div className="stat-card training">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <label>Progresso Formação</label>
            <div className="value">{stats.matrixProgress}%</div>
            <div className="sub-value">Conclusão média regional</div>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <label>Pendente Encomenda</label>
            <div className="value">{stats.shoppingValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            <div className="sub-value">Estimativa total de compras</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .regional-dashboard {
          background: #ffffff;
          border-radius: 1.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .title-area h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ana-text {
          color: #10b981;
          font-style: italic;
        }

        .badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .date-badge {
          background: #0f172a;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }

        .stat-icon {
          font-size: 2rem;
          width: 56px;
          height: 56px;
          background: white;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .stat-info label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .value {
          font-size: 1.4rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .sub-value {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        .stat-card.warning { border-left: 5px solid #ef4444; }
        .stat-card.warning .value { color: #ef4444; }

        .stat-card.training { border-left: 5px solid #8b5cf6; }
        .stat-card.training .value { color: #8b5cf6; }

        .stat-card.primary { border-left: 5px solid #3b82f6; }
        .stat-card.secondary { border-left: 5px solid #10b981; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
