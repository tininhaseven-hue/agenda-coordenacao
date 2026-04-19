'use client';

import { useMemo, useState } from 'react';
import { PerformanceKPIs } from '@/types';

interface PerformanceChartProps {
  data: PerformanceKPIs[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartInfo = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort by total sales value as requested
    const sortedData = [...data].sort((a, b) => b.accumMonthSales - a.accumMonthSales);

    const margin = { top: 40, right: 30, bottom: 60, left: 70 };
    const width = 1000;
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxVal = Math.max(
      ...sortedData.map(d => Math.max(d.accumMonthSales, d.budgetSales))
    ) * 1.1 || 1000;

    const barGroupWidth = innerWidth / sortedData.length;
    const barWidth = barGroupWidth * 0.35;
    const gap = barGroupWidth * 0.05;

    return {
      margin, width, height, innerWidth, innerHeight,
      sortedData, maxVal, barGroupWidth, barWidth, gap
    };
  }, [data]);

  if (!chartInfo || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0', color: '#94a3b8' 
      }}>
        Aguardando dados para gerar análise competitiva...
      </div>
    );
  }

  const { width, height, margin, innerHeight, innerWidth, sortedData, maxVal, barGroupWidth, barWidth, gap } = chartInfo;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const getPercent = (actual: number, budget: number) => {
    if (budget === 0) return '0%';
    const pct = (actual / budget) * 100;
    return `${pct.toFixed(0)}%`;
  };

  return (
    <div className="chart-container animate-fade" style={{ position: 'relative', margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Comparativo Realizado vs Orçamento
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Análise de gap e contribuição por unidade (Acumulado Mês)</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></div>
            <span style={{ color: '#1e293b' }}>Realizado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#e2e8f0', border: '1px solid #cbd5e1' }}></div>
            <span style={{ color: '#64748b' }}>Orçamento</span>
          </div>
        </div>
      </div>

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Y Axis Grid & Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line 
              x1={margin.left} 
              y1={margin.top + innerHeight * (1 - v)} 
              x2={margin.left + innerWidth} 
              y2={margin.top + innerHeight * (1 - v)} 
              stroke="#f1f5f9" 
              strokeWidth="1"
            />
            <text 
              x={margin.left - 15} 
              y={margin.top + innerHeight * (1 - v)} 
              textAnchor="end" 
              alignmentBaseline="middle" 
              fill="#94a3b8" 
              style={{ fontSize: '11px', fontWeight: 600 }}
            >
              {formatCurrency(maxVal * v)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {sortedData.map((d, i) => {
          const xBase = margin.left + i * barGroupWidth + (barGroupWidth - (barWidth * 2 + gap)) / 2;
          const actualHeight = (d.accumMonthSales / maxVal) * innerHeight;
          const budgetHeight = (d.budgetSales / maxVal) * innerHeight;
          const isWinning = d.accumMonthSales >= d.budgetSales;

          return (
            <g key={d.store} onMouseEnter={() => setHoveredIndex(i)} style={{ cursor: 'pointer' }}>
              {/* Budget Bar (Background/Reference) */}
              <rect 
                x={xBase + barWidth + gap} 
                y={margin.top + innerHeight - budgetHeight} 
                width={barWidth} 
                height={budgetHeight} 
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="1"
                rx="2"
              />

              {/* Actual Bar */}
              <rect 
                x={xBase} 
                y={margin.top + innerHeight - actualHeight} 
                width={barWidth} 
                height={actualHeight} 
                fill={isWinning ? '#10b981' : '#3b82f6'}
                rx="2"
                className="bar-animate"
              />

              {/* Performance Label on top */}
              <text 
                x={xBase + barWidth / 2} 
                y={margin.top + innerHeight - actualHeight - 10} 
                textAnchor="middle" 
                fill={isWinning ? '#059669' : '#2563eb'}
                style={{ fontSize: '10px', fontWeight: 800 }}
              >
                {getPercent(d.accumMonthSales, d.budgetSales)}
              </text>

              {/* X Axis Labels (Store names) */}
              <text 
                x={xBase + barWidth + gap / 2} 
                y={margin.top + innerHeight + 25} 
                textAnchor="middle" 
                fill="#1e293b" 
                style={{ fontSize: '10px', fontWeight: 700 }}
              >
                {d.store}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Custom Tooltip */}
      {hoveredIndex !== null && sortedData[hoveredIndex] && (
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '1rem',
          borderRadius: '1rem',
          fontSize: '0.85rem',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '220px'
        }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#60a5fa', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '0.5rem' }}>
            {sortedData[hoveredIndex].store}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Realizado:</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(sortedData[hoveredIndex].accumMonthSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Orçamento:</span>
              <span style={{ color: '#cbd5e1' }}>{formatCurrency(sortedData[hoveredIndex].budgetSales)}</span>
            </div>
            <div style={{ 
              marginTop: '0.5rem', 
              paddingTop: '0.5rem', 
              borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
              display: 'flex', 
              justifyContent: 'space-between',
              color: sortedData[hoveredIndex].accumMonthSales >= sortedData[hoveredIndex].budgetSales ? '#4ade80' : '#f87171'
            }}>
              <span style={{ fontWeight: 600 }}>Desvio:</span>
              <span style={{ fontWeight: 800 }}>
                {formatCurrency(sortedData[hoveredIndex].accumMonthSales - sortedData[hoveredIndex].budgetSales)}
                ({getPercent(sortedData[hoveredIndex].accumMonthSales, sortedData[hoveredIndex].budgetSales)})
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chart-container {
          background: #ffffff;
          padding: 2rem;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .bar-animate {
          animation: barGrow 1s ease-out;
        }
        @keyframes barGrow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
        .animate-fade {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
