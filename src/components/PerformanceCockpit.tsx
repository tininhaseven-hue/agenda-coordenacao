'use client';

import { useState, Fragment } from 'react';
import React from 'react';
import { usePerformance } from '@/hooks/usePerformance';
import { ALL_STORES } from '@/types';
import { exportPerformanceToExcel } from '@/utils/reportExportUtils';
import { PerformanceChart } from './PerformanceChart';

export function PerformanceCockpit() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'settings'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const { dailyData, budgets, updateDailySales, updateBudget, getPerformanceKPIs, getDailyTotals, monthlyNotes, saveMonthlyNotes, isLoaded, seedAprilData } = usePerformance(selectedMonth);

  const [entryDate, setEntryDate] = useState(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  const [tempSales, setTempSales] = useState<Record<string, { sales: string, trans: string }>>({});
  const [monthBuffer, setMonthBuffer] = useState<Record<string, Record<string, { sales: string, trans: string }>>>({});

  const [isMaximized, setIsMaximized] = useState(false);
  const kpis = getPerformanceKPIs();
  const dailyTotals = getDailyTotals();

  // Days left calculation
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
  const currentDay = now.getDate();
  const daysLeft = isCurrentMonth ? (daysInMonth - currentDay + 1) : Math.max(0, daysInMonth - currentDay);
  
  const renderDailyRequired = (accum: number, budget: number) => {
    if (!isCurrentMonth) return '-';
    const remaining = budget - accum;
    if (remaining <= 0) return <span style={{ color: '#10b981', fontWeight: 800 }}>✓ OK</span>;
    if (daysLeft <= 0) return '-';
    return formatCurrency(remaining / daysLeft);
  };

  // Initialize month buffer when entering entry tab or changing month
  React.useEffect(() => {
    if (activeTab === 'entry' && isLoaded) {
      const initialBuffer: Record<string, Record<string, { sales: string, trans: string }>> = {};
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
        initialBuffer[dateStr] = {};
        
        const existingDayData = dailyData[dateStr] || {};
        ALL_STORES.forEach(store => {
          const storeData = existingDayData[store] || { sales: 0, transactions: 0 };
          initialBuffer[dateStr][store] = {
            sales: storeData.sales > 0 ? String(storeData.sales) : '',
            trans: storeData.transactions > 0 ? String(storeData.transactions) : ''
          };
        });
      }
      setMonthBuffer(initialBuffer);
    }
  }, [activeTab, selectedMonth, isLoaded, dailyData]);

  if (!isLoaded) return <div style={{ padding: '2rem', textAlign: 'center' }}>A carregar cockpit de performance...</div>;

  const generateAutomatedAnalysis = () => {
    if (kpis.length === 0) return "Sem dados suficientes para análise.";

    const totalYesterday = kpis.reduce((acc, k) => acc + k.yesterdaySales, 0);
    const totalProjected = kpis.reduce((acc, k) => acc + k.projectedSales, 0);
    const totalBudget = kpis.reduce((acc, k) => acc + k.budgetSales, 0);
    const globalPO = totalBudget > 0 ? ((totalProjected / totalBudget) - 1) * 100 : 0;

    const bestStore = [...kpis].sort((a, b) => (b.projectedSales / (b.budgetSales || 1)) - (a.projectedSales / (a.budgetSales || 1)))[0];
    const worstStore = [...kpis].sort((a, b) => (a.projectedSales / (a.budgetSales || 1)) - (b.projectedSales / (b.budgetSales || 1)))[0];

    // Daily analysis
    let strongestDay = { date: '', totalSales: 0 };
    let weakestDay = { date: '', totalSales: Infinity };
    
    dailyTotals.forEach(d => {
      if (d.totalSales > strongestDay.totalSales) strongestDay = d;
      if (d.totalSales < weakestDay.totalSales && d.totalSales > 0) weakestDay = d;
    });

    const formatD = (d: string) => d.split('-').reverse().join('/');

    let text = `O mês de ${selectedMonth} apresenta uma performance global ` + 
      (globalPO >= 0 ? "positiva" : "abaixo do esperado") + 
      `, com um desvio P/O de ${globalPO.toFixed(2)}% face ao orçamento global do grupo.\n\n`;

    text += `### 🏆 Destaques Operacionais\n`;
    text += `A unidade **${bestStore.store}** lidera o crescimento, projetando um fecho de ${formatPercent(bestStore.projectedSales, bestStore.budgetSales)} face à meta. `;
    if (worstStore && worstStore !== bestStore && (worstStore.projectedSales / (worstStore.budgetSales || 1)) < 0.95) {
      text += `Em contraste, **${worstStore.store}** requer acompanhamento estratégico devido ao desvio negativo atual.\n\n`;
    } else {
      text += `A rede mantém-se estável sem desvios críticos significativos.\n\n`;
    }

    text += `### 📅 Padrões de Venda e Fluxo\n`;
    if (strongestDay.date) {
      text += `O ponto alto do mês registou-se no dia **${formatD(strongestDay.date)}**, com uma faturação total de ${formatCurrency(strongestDay.totalSales)}, sendo o dia de maior tração para o grupo. `;
    }
    if (weakestDay.date && weakestDay.date !== strongestDay.date) {
      text += `Pelo contrário, o dia **${formatD(weakestDay.date)}** apresentou a maior quebra de vendas voluntária, necessitando de análise de causas (sazonalidade ou fatores externos).`;
    }

    text += `\n\n### 💡 Eficiência (Receita Média)\n`;
    const avgReceiptGlobal = kpis.reduce((acc, k) => acc + k.yesterdaySales, 0) / (kpis.reduce((acc, k) => acc + k.yesterdayTransactions, 0) || 1);
    text += `A receita média consolidada do dia anterior situou-se nos ${formatCurrency(avgReceiptGlobal)}. O foco deve manter-se na conversão e no aumento do ticket médio para otimizar a rentabilidade por transação.`;

    saveMonthlyNotes(text);
  };

  const handleSaveMonthly = () => {
    Object.entries(monthBuffer).forEach(([date, stores]) => {
      Object.entries(stores).forEach(([store, data]) => {
        const sales = parseFloat(data.sales) || 0;
        const trans = parseInt(data.trans) || 0;
        
        // Only update if there's actually data or if we want to clear it (0)
        // For simplicity, we update everything in the buffer
        updateDailySales(date, store, { sales, transactions: trans });
      });
    });
    alert('Dados mensais guardados com sucesso!');
  };

  const handlePrint = () => {
    const formatC = (val: number) =>
      new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatPct = (actual: number, budget: number) => {
      if (budget === 0) return '–';
      const pct = ((actual / budget) - 1) * 100;
      return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    };
    const poColor = (actual: number, budget: number) =>
      budget === 0 ? '#64748b' : actual >= budget ? '#16a34a' : '#dc2626';

    const groups = [
      { name: 'SOL VAGOS', stores: ['Vagos Norte', 'Vagos Sul'] },
      { name: 'SOL AVEIRO', stores: ['Aveiro Norte', 'Aveiro Sul'] },
      { name: 'SOL OVAR', stores: ['Ovar Norte', 'Ovar Sul'] },
      { name: 'VILAR PARAÍSO', stores: ['Vilar do Paraíso Norte'] },
    ];

    let rowsHtml = '';
    groups.forEach(group => {
      const groupKpis = kpis.filter(k => group.stores.includes(k.store));
      if (groupKpis.length === 0) return;

      const sub = {
        ySales: groupKpis.reduce((a, k) => a + k.yesterdaySales, 0),
        accum: groupKpis.reduce((a, k) => a + k.accumMonthSales, 0),
        proj: groupKpis.reduce((a, k) => a + k.projectedSales, 0),
        budgS: groupKpis.reduce((a, k) => a + k.budgetSales, 0),
        yTrans: groupKpis.reduce((a, k) => a + k.yesterdayTransactions, 0),
        budgT: groupKpis.reduce((a, k) => a + k.budgetTransactions, 0),
      };
      const subAvgR = sub.yTrans > 0 ? sub.ySales / sub.yTrans : 0;
      const subBudgR = sub.budgT > 0 ? sub.budgS / sub.budgT : 0;

      groupKpis.forEach(k => {
        const avgR = k.yesterdaySales / (k.yesterdayTransactions || 1);
        const remaining = k.budgetSales - k.accumMonthSales;
        const dailyReq = (isCurrentMonth && daysLeft > 0) 
          ? (remaining > 0 ? formatC(remaining / daysLeft) : 'OK') 
          : '-';

        rowsHtml += `<tr>
          <td class="store-name">${k.store}</td>
          <td>${formatC(k.yesterdaySales)}</td>
          <td>${formatC(k.accumMonthSales)}</td>
          <td>${formatC(k.projectedSales)}</td>
          <td>${formatC(k.budgetSales)}</td>
          <td>${dailyReq}</td>
          <td class="po" style="background:${poColor(k.projectedSales, k.budgetSales)}">${formatPct(k.projectedSales, k.budgetSales)}</td>
          <td>${k.yesterdayTransactions}</td>
          <td>${k.budgetTransactions}</td>
          <td class="po" style="background:${poColor(k.yesterdayTransactions, k.budgetTransactions / 30)}">${formatPct(k.yesterdayTransactions, k.budgetTransactions / 30)}</td>
          <td>${formatC(k.budgetReceipt)}</td>
          <td>${k.yesterdayTransactions}</td>
          <td>${formatC(avgR)}</td>
          <td class="po" style="background:${poColor(avgR, k.budgetReceipt)}">${formatPct(avgR, k.budgetReceipt)}</td>
        </tr>`;
      });

      if (group.stores.length > 1) {
        const subRemaining = sub.budgS - sub.accum;
        const subDailyReq = (isCurrentMonth && daysLeft > 0) 
          ? (subRemaining > 0 ? formatC(subRemaining / daysLeft) : 'OK') 
          : '-';

        rowsHtml += `<tr class="subtotal">
          <td class="store-name">${group.name}</td>
          <td>${formatC(sub.ySales)}</td>
          <td>${formatC(sub.accum)}</td>
          <td>${formatC(sub.proj)}</td>
          <td>${formatC(sub.budgS)}</td>
          <td>${subDailyReq}</td>
          <td class="po" style="background:${poColor(sub.proj, sub.budgS)}">${formatPct(sub.proj, sub.budgS)}</td>
          <td>${sub.yTrans}</td>
          <td>${sub.budgT}</td>
          <td class="po" style="background:${poColor(sub.yTrans, sub.budgT / 30)}">${formatPct(sub.yTrans, sub.budgT / 30)}</td>
          <td>${formatC(subBudgR)}</td>
          <td>${sub.yTrans}</td>
          <td>${formatC(subAvgR)}</td>
          <td class="po" style="background:${poColor(subAvgR, subBudgR)}">${formatPct(subAvgR, subBudgR)}</td>
        </tr>`;
      }
    });

    const totalAccumT = kpis.reduce((a, k) => a + k.accumMonthTransactions, 0);
    const totalBudgetT = kpis.reduce((a, k) => a + k.budgetTransactions, 0);
    const totalAvgR = totalAccumT > 0 ? totalAccumSales / totalAccumT : 0;
    const totalBudgR = totalBudgetT > 0 ? totalBudgetSales / totalBudgetT : 0;

    const totalRemaining = totalBudgetSales - totalAccumSales;
    const totalDailyReq = (isCurrentMonth && daysLeft > 0) 
      ? (totalRemaining > 0 ? formatC(totalRemaining / daysLeft) : 'OK') 
      : '-';

    rowsHtml += `<tr class="total">
      <td>TOTAL ÁREAS DE SERVIÇO - ANA</td>
      <td>${formatC(totalYesterdaySales)}</td>
      <td>${formatC(totalAccumSales)}</td>
      <td>${formatC(totalProjectedSales)}</td>
      <td>${formatC(totalBudgetSales)}</td>
      <td>${totalDailyReq}</td>
      <td class="po" style="background:${poColor(totalProjectedSales, totalBudgetSales)}">${formatPct(totalProjectedSales, totalBudgetSales)}</td>
      <td>${totalAccumT}</td>
      <td>${totalBudgetT}</td>
      <td class="po" style="background:${poColor(totalAccumT, totalBudgetT)}">${formatPct(totalAccumT, totalBudgetT)}</td>
      <td>${formatC(totalBudgR)}</td>
      <td>${totalAccumT}</td>
      <td>${formatC(totalAvgR)}</td>
      <td class="po" style="background:${poColor(totalAvgR, totalBudgR)}">${formatPct(totalAvgR, totalBudgR)}</td>
    </tr>`;

    const analysisHtml = monthlyNotes
      ? `<div class="analysis">
           <h3>📈 Análise Estratégica do Mês</h3>
           <div style="white-space:pre-line;font-size:8pt;line-height:1.5;">${monthlyNotes}</div>
         </div>`
      : '';

    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>Performance – ${monthName}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:Arial,sans-serif; font-size:7.5pt; color:#1e293b; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:2px solid #0f172a; padding-bottom:6px; }
    .header h1 { font-size:13pt; font-weight:900; }
    .header .sub { font-size:7pt; color:#64748b; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    th, td { border:1px solid #cbd5e1; padding:3px 4px; text-align:center; overflow:hidden; white-space:nowrap; }
    .store-name { text-align:left !important; font-weight:700; background:#f8fafc; }
    .h-store { background:#f97316; color:white; font-weight:800; font-size:7pt; }
    .h-sales { background:#3b82f6; color:white; font-weight:800; font-size:7pt; }
    .h-trans { background:#06b6d4; color:white; font-weight:800; font-size:7pt; }
    .h-recv  { background:#10b981; color:white; font-weight:800; font-size:7pt; }
    .sub-h   { background:#f1f5f9; color:#475569; font-weight:700; font-size:6.5pt; }
    .po { color:white; font-weight:700; }
    .subtotal { background:#f1f5f9; font-weight:800; border-top:2px solid #94a3b8; }
    .total { background:#0f172a; color:white; font-weight:900; }
    .analysis { margin-top:14px; border:1px solid #cbd5e1; border-radius:6px; padding:10px; page-break-inside:avoid; }
    .analysis h3 { font-size:9pt; margin-bottom:6px; border-bottom:1px solid #cbd5e1; padding-bottom:4px; }
    @page { size:A4 landscape; margin:1cm; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Resumo de Performance – ${monthName}</h1>
      <div class="sub">Agenda de Coordenação Ibersol · Gerado em ${new Date().toLocaleDateString('pt-PT')}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="h-store" rowspan="2">ÁREAS DE SERVIÇO</th>
        <th class="h-sales" colspan="6">Vendas</th>
        <th class="h-trans" colspan="3">Transações</th>
        <th class="h-recv"  colspan="4">Receita Média</th>
      </tr>
      <tr>
        <th class="sub-h">Dia ant.</th>
        <th class="sub-h">Acum Mês</th>
        <th class="sub-h">Projec.</th>
        <th class="sub-h">Orçam.</th>
        <th class="sub-h">Falta/Dia</th>
        <th class="sub-h">P/O</th>
        <th class="sub-h">Abr</th>
        <th class="sub-h">Orçam.</th>
        <th class="sub-h">P/O</th>
        <th class="sub-h">Orçam.</th>
        <th class="sub-h">Trans</th>
        <th class="sub-h">Abr</th>
        <th class="sub-h">P/O</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  ${analysisHtml}
</body>
</html>`;

    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const formatCurrency = (val: number, decimals = 0) => {
    return new Intl.NumberFormat('pt-PT', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: decimals 
    }).format(val);
  };

  const formatPercent = (actual: number, budget: number) => {
    if (budget === 0) return '0%';
    const pct = ((actual / budget) - 1) * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  const getPOColor = (actual: number, budget: number) => {
    if (budget === 0) return '#64748b';
    return actual >= budget ? '#22c55e' : '#ef4444';
  };

  // Totals
  const totalYesterdaySales = kpis.reduce((acc, k) => acc + k.yesterdaySales, 0);
  const totalAccumSales = kpis.reduce((acc, k) => acc + k.accumMonthSales, 0);
  const totalProjectedSales = kpis.reduce((acc, k) => acc + k.projectedSales, 0);
  const totalBudgetSales = kpis.reduce((acc, k) => acc + k.budgetSales, 0);
  const totalAccumTransactions = kpis.reduce((acc, k) => acc + k.accumMonthTransactions, 0);
  const totalBudgetTransactions = kpis.reduce((acc, k) => acc + k.budgetTransactions, 0);
  const totalBudgetReceipt = totalBudgetTransactions > 0 ? totalBudgetSales / totalBudgetTransactions : 0;
  const totalAvgReceipt = totalAccumTransactions > 0 ? totalAccumSales / totalAccumTransactions : 0;

  const thEntry: React.CSSProperties = {
    padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, fontSize: '0.7rem'
  };
  const tdEntry: React.CSSProperties = {
    padding: '0.25rem', border: '1px solid #cbd5e1', textAlign: 'center'
  };
  const entryInput: React.CSSProperties = {
    width: '100%', padding: '0.4rem', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '0.8rem', outline: 'none'
  };

  const TableContent = () => (
    <table className="kpi-table" style={{ fontSize: isMaximized ? '0.85rem' : '0.64rem' }}>
      <colgroup>
        <col style={{ width: isMaximized ? '180px' : '130px' }} />
        {Array.from({ length: 14 }).map((_, i) => (
          <col key={i} style={{ width: `${(100 / 14) * 10 / 10}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr className="main-headers">
          <th rowSpan={2} className="header-store">ÁREAS DE SERVIÇO - ANA</th>
          <th colSpan={6} className="header-vendas">Vendas</th>
          <th colSpan={3} className="header-trans">Transações</th>
          <th colSpan={4} className="header-receita">Receita Média</th>
        </tr>
        <tr className="sub-headers">
          <th>Dia ant.</th>
          <th>Acum Mês</th>
          <th>Projec.</th>
          <th>Orçam.</th>
          <th>Falta/Dia</th>
          <th>P/O</th>
          <th>Abr</th>
          <th>Orçam.</th>
          <th>P/O</th>
          <th>Orçam.</th>
          <th>Trans</th>
          <th>Abr</th>
          <th>P/O</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: 'SOL VAGOS', stores: ['Vagos Norte', 'Vagos Sul'] },
          { name: 'SOL AVEIRO', stores: ['Aveiro Norte', 'Aveiro Sul'] },
          { name: 'SOL OVAR', stores: ['Ovar Norte', 'Ovar Sul'] },
          { name: 'VILAR PARAÍSO', stores: ['Vilar do Paraíso Norte'] }
        ].map(group => {
          const groupKpis = kpis.filter(k => group.stores.includes(k.store));
          if (groupKpis.length === 0) return null;

          const subYesterdaySales = groupKpis.reduce((acc, k) => acc + k.yesterdaySales, 0);
          const subAccumSales = groupKpis.reduce((acc, k) => acc + k.accumMonthSales, 0);
          const subProjectedSales = groupKpis.reduce((acc, k) => acc + k.projectedSales, 0);
          const subBudgetSales = groupKpis.reduce((acc, k) => acc + k.budgetSales, 0);
          const subAccumTrans = groupKpis.reduce((acc, k) => acc + k.accumMonthTransactions, 0);
          const subBudgetTrans = groupKpis.reduce((acc, k) => acc + k.budgetTransactions, 0);
          const subBudgetReceipt = subBudgetTrans > 0 ? subBudgetSales / subBudgetTrans : 0;
          const subAvgReceipt = subAccumTrans > 0 ? subAccumSales / subAccumTrans : 0;

          return (
            <React.Fragment key={group.name}>
              {groupKpis.map((k, idx) => (
                <tr key={k.store} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td className="store-name" style={{ textAlign: 'left', paddingLeft: '10px', fontWeight: 700, borderLeft: '1px solid #e2e8f0' }}>{k.store}</td>
                  <td>{formatCurrency(k.yesterdaySales)}</td>
                  <td>{formatCurrency(k.accumMonthSales)}</td>
                  <td>{formatCurrency(k.projectedSales)}</td>
                  <td>{formatCurrency(k.budgetSales)}</td>
                  <td>{renderDailyRequired(k.accumMonthSales, k.budgetSales)}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 700 }}>
                    {formatPercent(k.projectedSales, k.budgetSales)}
                  </td>
                  <td>{k.accumMonthTransactions}</td>
                  <td>{k.budgetTransactions}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 700 }}>
                    {formatPercent(k.accumMonthTransactions, k.budgetTransactions)}
                  </td>
                  <td>{formatCurrency(k.budgetReceipt, 2)}</td>
                  <td>{k.accumMonthTransactions}</td>
                  <td>{formatCurrency(k.accumMonthSales / (k.accumMonthTransactions || 1), 2)}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 700 }}>
                    {formatPercent(k.accumMonthSales / (k.accumMonthTransactions || 1), k.budgetReceipt)}
                  </td>
                </tr>
              ))}
              {group.stores.length > 1 && (
                <tr className="subtotal-row" style={{ backgroundColor: '#ffffff', fontWeight: 800, color: '#1e293b' }}>
                  <td className="store-name" style={{ textAlign: 'left', paddingLeft: '10px', fontWeight: 900 }}>{group.name}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subYesterdaySales)}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subAccumSales)}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subProjectedSales)}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subBudgetSales)}</td>
                  <td style={{ fontWeight: 800 }}>{renderDailyRequired(subAccumSales, subBudgetSales)}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 900 }}>
                    {formatPercent(subProjectedSales, subBudgetSales)}
                  </td>
                  <td style={{ fontWeight: 800 }}>{subAccumTrans}</td>
                  <td style={{ fontWeight: 800 }}>{subBudgetTrans}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 900 }}>
                    {formatPercent(subAccumTrans, subBudgetTrans)}
                  </td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subBudgetReceipt, 2)}</td>
                  <td style={{ fontWeight: 800 }}>{subAccumTrans}</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(subAvgReceipt, 2)}</td>
                  <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 900 }}>
                    {formatPercent(subAvgReceipt, subBudgetReceipt)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="total-row" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 900 }}>
          <td style={{ textAlign: 'left', paddingLeft: '10px', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 900 }}>TOTAL ÁREAS DE SERVIÇO - ANA</td>
          <td>{formatCurrency(totalYesterdaySales)}</td>
          <td>{formatCurrency(totalAccumSales)}</td>
          <td>{formatCurrency(totalProjectedSales)}</td>
          <td>{formatCurrency(totalBudgetSales)}</td>
          <td>{renderDailyRequired(totalAccumSales, totalBudgetSales)}</td>
          <td style={{ backgroundColor: '#64748b', color: 'white', fontWeight: 900 }}>
            {formatPercent(totalProjectedSales, totalBudgetSales)}
          </td>
          <td>{totalAccumTransactions}</td>
          <td>{totalBudgetTransactions}</td>
          <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 900 }}>
            {formatPercent(totalAccumTransactions, totalBudgetTransactions)}
          </td>
          <td>{formatCurrency(totalBudgetReceipt, 2)}</td>
          <td>{totalAccumTransactions}</td>
          <td>{formatCurrency(totalAvgReceipt, 2)}</td>
          <td style={{ color: 'white', backgroundColor: '#64748b', fontWeight: 900 }}>
            {formatPercent(totalAvgReceipt, totalBudgetReceipt)}
          </td>
        </tr>
      </tfoot>
    </table>
  );

  return (
    <div className="performance-container">
      {/* MODAL MAXIMIZADO */}
      {isMaximized && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.98)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Vista Ampliada de Performance</h2>
            <button 
              onClick={() => setIsMaximized(false)}
              style={{
                background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              FECHAR [X]
            </button>
          </div>
          <div className="table-wrapper maximized" style={{ backgroundColor: 'white', borderRadius: '0.5rem' }}>
            <TableContent />
          </div>
        </div>
      )}

      <div className="performance-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Resumo de Performance</h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Controlo financeiro e projeção mensal por unidade</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={generateAutomatedAnalysis} className="insight-btn no-print">💡 Gerar Análise</button>
          <button onClick={() => exportPerformanceToExcel(kpis, selectedMonth)} className="excel-btn no-print">📊 Exportar EXCEL</button>
          <button onClick={handlePrint} className="print-btn no-print">📄 Exportar PDF</button>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-picker"
          />
        </div>
      </div>

      <div className="performance-navigation">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={activeTab === 'dashboard' ? 'active' : ''}
        >📊 Dashboard</button>
        <button 
          onClick={() => setActiveTab('entry')} 
          className={activeTab === 'entry' ? 'active' : ''}
        >✍️ Inserir Dados</button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={activeTab === 'settings' ? 'active' : ''}
        >⚙️ Configurar Metas</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-view animate-in">
          <div 
            className="table-wrapper clickable" 
            onClick={() => setIsMaximized(true)}
            style={{ position: 'relative', cursor: 'zoom-in', marginBottom: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', overflowX: 'auto' }}
          >
            <div style={{
              position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, zIndex: 5,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#3b82f6', border: '1px solid #e2e8f0'
            }}>
              🔍 Clique para Ampliar
            </div>
            <TableContent />
          </div>

          <PerformanceChart data={kpis} />

          {monthlyNotes && (
            <div className="analysis-box animate-in">
              <h3>📈 Análise Estratégica do Mês</h3>
              <div className="analysis-content" style={{ whiteSpace: 'pre-line' }}>
                {monthlyNotes}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="entry-view animate-in">
          <div className="entry-card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Inserção Mensal de Dados</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Preencha as transações e vendas para o mês de {selectedMonth}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleSaveMonthly} className="save-btn" style={{ margin: 0, padding: '0.5rem 1.5rem' }}>💾 Guardar Alterações</button>
              </div>
            </div>

            <div className="monthly-entry-wrapper" style={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              <table className="monthly-entry-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white' }}>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ ...thEntry, position: 'sticky', left: 0, zIndex: 20, background: '#f8fafc', width: '120px' }}>Data</th>
                    {ALL_STORES.map(store => (
                      <th key={store} colSpan={2} style={{ ...thEntry, borderLeft: '2px solid #cbd5e1', background: '#e2e8f0', color: '#1e293b' }}>
                        {store.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ ...thEntry, position: 'sticky', left: 0, zIndex: 20, background: '#f1f5f9' }}>Dia Sem.</th>
                    {ALL_STORES.map(store => (
                      <React.Fragment key={`${store}-sub`}>
                        <th style={{ ...thEntry, borderLeft: '2px solid #cbd5e1' }}>Trans.</th>
                        <th style={thEntry}>Venda (€)</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const [year, month] = selectedMonth.split('-').map(Number);
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const rows = [];
                    for (let i = 1; i <= daysInMonth; i++) {
                      const date = new Date(year, month - 1, i);
                      const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });
                      
                      rows.push(
                        <tr key={dateStr} style={{ background: isWeekend ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ ...tdEntry, position: 'sticky', left: 0, zIndex: 5, background: isWeekend ? '#f8fafc' : 'white', fontWeight: 800, borderRight: '2px solid #cbd5e1' }}>
                            {dateStr} <br/>
                            <span style={{ fontSize: '0.65rem', color: isWeekend ? '#ef4444' : '#64748b' }}>({dayName})</span>
                          </td>
                          {ALL_STORES.map(store => (
                            <React.Fragment key={`${dateStr}-${store}`}>
                              <td style={{ ...tdEntry, borderLeft: '2px solid #cbd5e1' }}>
                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  value={monthBuffer[dateStr]?.[store]?.trans || ''}
                                  onChange={(e) => setMonthBuffer(prev => ({
                                    ...prev,
                                    [dateStr]: {
                                      ...prev[dateStr],
                                      [store]: { ...prev[dateStr][store], trans: e.target.value }
                                    }
                                  }))}
                                  style={entryInput}
                                />
                              </td>
                              <td style={tdEntry}>
                                <input 
                                  type="text"
                                  inputMode="decimal"
                                  value={monthBuffer[dateStr]?.[store]?.sales || ''}
                                  onChange={(e) => setMonthBuffer(prev => ({
                                    ...prev,
                                    [dateStr]: {
                                      ...prev[dateStr],
                                      [store]: { ...prev[dateStr][store], sales: e.target.value }
                                    }
                                  }))}
                                  style={entryInput}
                                />
                              </td>
                            </React.Fragment>
                          ))}
                        </tr>
                      );
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={handleSaveMonthly} className="save-btn" style={{ width: 'auto', padding: '0.75rem 3rem' }}>💾 Guardar Todas as Alterações</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-view animate-in">
          <div className="entry-card">
            <h3>Orçamentos de {selectedMonth}</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Defina as metas mensais para cada loja. O sistema usará estes valores para calcular a performance.</p>
            
            <div className="entry-grid">
              {ALL_STORES.map(store => (
                <div key={store} className="entry-row">
                  <span className="store-label">{store}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      placeholder="Venda Mensal (€)" 
                      defaultValue={budgets[store]?.monthlySales || ''}
                      onBlur={(e) => updateBudget(store, { 
                        monthlySales: parseFloat(e.target.value) || 0, 
                        monthlyTransactions: budgets[store]?.monthlyTransactions || 0 
                      })}
                    />
                    <input 
                      type="number" 
                      placeholder="Transacções Mensais" 
                      defaultValue={budgets[store]?.monthlyTransactions || ''}
                      onBlur={(e) => updateBudget(store, { 
                        monthlySales: budgets[store]?.monthlySales || 0, 
                        monthlyTransactions: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-container {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 1.25rem;
          margin-bottom: 2rem;
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .month-picker {
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-weight: 600;
          outline: none;
        }

        .performance-navigation {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 1rem;
        }

        .performance-navigation button {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 0.5rem;
        }

        .performance-navigation button.active {
          color: #3b82f6;
          background: #eff6ff;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
        }

        .kpi-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.64rem;
          table-layout: fixed;
        }

        .kpi-table th, .kpi-table td {
          padding: 0.35rem 0.2rem;
          border: 1px solid #e2e8f0;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kpi-table col.store-col { width: 130px; }

        .main-headers th {
          font-weight: 800;
          text-transform: uppercase;
          color: white;
        }

        .header-store { background: #f97316; }
        .header-vendas { background: #3b82f6; }
        .header-trans { background: #06b6d4; }
        .header-receita { background: #10b981; }

        .sub-headers th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          border-bottom: 1px solid #e2e8f0;
        }

        .kpi-table tr:nth-child(even) { background-color: #f8fafc; }
        .kpi-table tr:hover { background-color: #f1f5f9; transition: background 0.2s; }

        .store-name {
          text-align: left !important;
          font-weight: 700;
          color: #1e293b;
          background: transparent !important;
          border-left: none !important;
          padding-left: 0.75rem !important;
        }

        .total-row {
          background: #0f172a !important;
          color: #f8fafc !important;
          font-weight: 900;
          font-size: 0.75rem !important;
        }

        .subtotal-row {
          background: #e2e8f0 !important;
          font-weight: 800;
          color: #1e293b;
        }

        .subtotal-row td {
          border-top: 2px solid #94a3b8 !important;
          border-bottom: 2px solid #94a3b8 !important;
        }

        .entry-card {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
        }

        .entry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .entry-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .store-label {
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
        }

        .entry-row input {
          width: 100%;
          padding: 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          outline: none;
        }

        .save-btn {
          margin-top: 2rem;
          width: 100%;
          padding: 1rem;
          background: #1e293b;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .animate-in {
          animation: slideUp 0.3s ease-out;
        }

        .insight-btn {
          background: #eff6ff;
          color: #3b82f6;
          border: 1px solid #3b82f6;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .excel-btn {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #16a34a;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .print-btn {
          background: #1e293b;
          color: white;
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .analysis-box {
          margin-top: 2rem;
          padding: 2rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
        }

        .analysis-box h3 {
          margin-top: 0;
          color: #1e293b;
          font-size: 1.1rem;
          border-bottom: 2px solid #3b82f6;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .analysis-content {
          color: #334155;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        @media print {
          .no-print { display: none !important; }
          .performance-container { 
            box-shadow: none !important; 
            padding: 0 !important;
            margin: 0 !important;
          }
          .table-wrapper { border: 1px solid var(--accent-dark) !important; }
          .kpi-table th { background: #f1f5f9 !important; color: var(--accent-dark) !important; }
          .subtotal-row { background: #f8fafc !important; }
          .analysis-box { border: 1px solid #ccc !important; page-break-inside: avoid; }
          body { background: white !important; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
