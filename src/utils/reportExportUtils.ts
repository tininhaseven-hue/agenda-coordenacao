import * as XLSX from 'xlsx-js-style';
import { Store } from '@/types';

export interface ReportItem {
  id: string;
  isCustom: boolean;
  date: string;
  store: string;
  category: string;
  area: string;
  task: string;
  status: string; // 'CONCLUÍDO' | 'PENDENTE' | 'EM CURSO (X/Y)'
  notes: string;
}

export function exportTaskReportToExcel(items: ReportItem[], periodLabel: string) {
  const worksheetData = [
    ['RELATÓRIO DE EXECUÇÃO - ' + periodLabel.toUpperCase()],
    [''],
    ['DATA', 'LOJA', 'FREQUÊNCIA', 'ÁREA', 'TAREFA', 'ESTADO', 'NOTAS']
  ];

  items.forEach(item => {
    worksheetData.push([
      item.date,
      item.store,
      item.category,
      item.area,
      item.task,
      item.status,
      item.notes || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Configuração de largura de colunas
  worksheet['!cols'] = [
    { wch: 12 }, // Data
    { wch: 15 }, // Loja
    { wch: 12 }, // Frequência
    { wch: 20 }, // Área
    { wch: 40 }, // Tarefa
    { wch: 12 }, // Estado
    { wch: 50 }, // Notas
  ];

  // Estilização
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      const cell = worksheet[cell_ref];
      if (!cell) continue;

      cell.s = {
        alignment: { vertical: 'center', wrapText: true },
        font: { sz: 10, name: 'Calibri' },
        border: {
          top: { style: 'thin', color: { rgb: "E2E8F0" } },
          bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
          left: { style: 'thin', color: { rgb: "E2E8F0" } },
          right: { style: 'thin', color: { rgb: "E2E8F0" } }
        }
      };

      // Título Principal
      if (R === 0) {
        cell.s.font = { bold: true, sz: 14, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "000000" } };
        cell.s.alignment.horizontal = 'center';
      }

      // Cabeçalhos
      if (R === 2) {
        cell.s.font = { bold: true, color: { rgb: "475569" } };
        cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
      }

      // Formatação condicional de Estado
      if (R > 2 && C === 5) {
        if (cell.v === 'CONCLUÍDO') {
          cell.s.font = { color: { rgb: "006100" }, bold: true };
          cell.s.fill = { fgColor: { rgb: "C6EFCE" } };
        } else if (cell.v && cell.v.includes('EM CURSO')) {
          cell.s.font = { color: { rgb: "9C6500" }, bold: true };
          cell.s.fill = { fgColor: { rgb: "FFEB9C" } };
        } else {
          cell.s.font = { color: { rgb: "9C0006" }, bold: true };
          cell.s.fill = { fgColor: { rgb: "FFC7CE" } };
        }
      }
    }
  }

  // Merge do título
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

  XLSX.writeFile(workbook, `Relatorio_Tarefas_${periodLabel.replace(/ /g, '_')}.xlsx`);
}

export function exportVisitReportToExcel(visit: any) {
  const worksheetData = [
    [`RELATÓRIO DE AUDITORIA - ${visit.store.toUpperCase()}`],
    [''],
    ['LOJA', visit.store, 'DATA', visit.date],
    ['TIPO', visit.type, 'ACOMPANHAMENTO', visit.accompaniment || 'N/A'],
    ['OBJETIVO', visit.objective, 'ESTADO FINAL', visit.status],
    [''],
    ['TAREFA', 'ESTADO', 'OBSERVAÇÕES']
  ];

  visit.checklist.forEach((item: any) => {
    worksheetData.push([
      item.text,
      item.status === 'OK' ? '✅ OK' : item.status === 'NAO_OK' ? '❌ NÃO OK' : 'PENDENTE',
      item.observations || ''
    ]);
  });

  if (visit.notes) {
    worksheetData.push(['']);
    worksheetData.push(['NOTAS E CONCLUSÕES GERAIS']);
    worksheetData.push([visit.notes]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Configuração de largura
  worksheet['!cols'] = [
    { wch: 50 }, // Tarefa
    { wch: 15 }, // Estado
    { wch: 60 }, // Observações
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria');

  XLSX.writeFile(workbook, `Relatorio_Auditoria_${visit.store}_${visit.date}.xlsx`);
}

export function exportPerformanceToExcel(kpis: any[], monthLabel: string) {
  const groups = [
    { name: 'SOL VAGOS', stores: ['Vagos Norte', 'Vagos Sul'] },
    { name: 'SOL AVEIRO', stores: ['Aveiro Norte', 'Aveiro Sul'] },
    { name: 'SOL OVAR', stores: ['Ovar Norte', 'Ovar Sul'] },
    { name: 'VILAR PARAÍSO', stores: ['Vilar do Paraíso Norte'] }
  ];

  const headerRow1 = [
    'ÁREAS DE SERVIÇO - ANA', 
    'VENDAS', '', '', '', '', 
    'TRANSAÇÕES', '', '', 
    'RECEITA MÉDIA', '', '', ''
  ];
  
  const headerRow2 = [
    '', 
    'Dia ant.', 'Acum Mês', 'Projec.', 'Orçam.', 'P/O', 
    'Abr', 'Orçam.', 'P/O', 
    'Orçam.', 'Trans', 'Abr', 'P/O'
  ];

  const rows: any[] = [
    [`RESUMO DE PERFORMANCE - ${monthLabel.toUpperCase()}`],
    [],
    headerRow1,
    headerRow2
  ];

  // Estilos Comuns
  const borderStyle = { 
    top: { style: 'thin', color: { rgb: "E2E8F0" } },
    bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
    left: { style: 'thin', color: { rgb: "E2E8F0" } },
    right: { style: 'thin', color: { rgb: "E2E8F0" } }
  };

  const centerAlign = { vertical: 'center', horizontal: 'center' };

  // Helper para formatar %
  const pct = (a: number, b: number) => b === 0 ? '0%' : `${(((a / b) - 1) * 100).toFixed(2)}%`;

  groups.forEach(group => {
    const groupKpis = kpis.filter(k => group.stores.includes(k.store));
    if (groupKpis.length === 0) return;

    groupKpis.forEach(k => {
      rows.push([
        k.store,
        k.yesterdaySales, k.accumMonthSales, k.projectedSales, k.budgetSales, pct(k.projectedSales, k.budgetSales),
        k.yesterdayTransactions, k.budgetTransactions, pct(k.yesterdayTransactions, k.budgetTransactions / 30),
        k.budgetReceipt, k.yesterdayTransactions, (k.yesterdaySales / (k.yesterdayTransactions || 1)), pct((k.yesterdaySales / (k.yesterdayTransactions || 1)), k.budgetReceipt)
      ]);
    });

    if (group.stores.length > 1) {
      const subYesterdaySales = groupKpis.reduce((acc, k) => acc + k.yesterdaySales, 0);
      const subAccumSales = groupKpis.reduce((acc, k) => acc + k.accumMonthSales, 0);
      const subProjectedSales = groupKpis.reduce((acc, k) => acc + k.projectedSales, 0);
      const subBudgetSales = groupKpis.reduce((acc, k) => acc + k.budgetSales, 0);
      const subYesterdayTrans = groupKpis.reduce((acc, k) => acc + k.yesterdayTransactions, 0);
      const subBudgetTrans = groupKpis.reduce((acc, k) => acc + k.budgetTransactions, 0);
      const subBudgetReceipt = subBudgetTrans > 0 ? subBudgetSales / subBudgetTrans : 0;
      const subAvgReceipt = subYesterdayTrans > 0 ? subYesterdaySales / subYesterdayTrans : 0;

      rows.push([
        group.name,
        subYesterdaySales, subAccumSales, subProjectedSales, subBudgetSales, pct(subProjectedSales, subBudgetSales),
        subYesterdayTrans, subBudgetTrans, pct(subYesterdayTrans, subBudgetTrans / 30),
        subBudgetReceipt, subYesterdayTrans, subAvgReceipt, pct(subAvgReceipt, subBudgetReceipt)
      ]);
    }
  });

  // Linha Total
  const totalY = kpis.reduce((acc, k) => acc + k.yesterdaySales, 0);
  const totalAcc = kpis.reduce((acc, k) => acc + k.accumMonthSales, 0);
  const totalProj = kpis.reduce((acc, k) => acc + k.projectedSales, 0);
  const totalBudg = kpis.reduce((acc, k) => acc + k.budgetSales, 0);
  rows.push([
    'TOTAL ÁREAS DE SERVIÇO - ANA',
    totalY, totalAcc, totalProj, totalBudg, pct(totalProj, totalBudg),
    '', '', '', '', '', '', ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Aplicação de Estilos
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '', t: 's' };
      const cell = worksheet[cellRef];

      cell.s = { font: { sz: 10, name: 'Calibri' }, border: borderStyle, alignment: centerAlign };

      // Título
      if (R === 0) {
        cell.s = { font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E293B" } }, alignment: centerAlign };
      }

      // Headers Row 1
      if (R === 2) {
        cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
        if (C === 0) cell.s.fill = { fgColor: { rgb: "F97316" } }; // Orange
        else if (C >= 1 && C <= 5) cell.s.fill = { fgColor: { rgb: "3B82F6" } }; // Blue
        else if (C >= 6 && C <= 8) cell.s.fill = { fgColor: { rgb: "06B6D4" } }; // Cyan
        else if (C >= 9 && C <= 12) cell.s.fill = { fgColor: { rgb: "10B981" } }; // Green
      }

      // Headers Row 2
      if (R === 3) {
        cell.s.font = { bold: true, color: { rgb: "475569" } };
        cell.s.fill = { fgColor: { rgb: "F8FAF6" } };
      }

      // Formatação Condicional P/O
      if (R > 3 && [5, 8, 12].includes(C)) {
        const val = parseFloat(cell.v);
        if (cell.v.includes('+') || (val >= 0 && !cell.v.includes('-'))) {
          cell.s.font = { color: { rgb: "006100" }, bold: true };
          cell.s.fill = { fgColor: { rgb: "C6EFCE" } };
        } else if (cell.v.includes('-')) {
          cell.s.font = { color: { rgb: "9C0006" }, bold: true };
          cell.s.fill = { fgColor: { rgb: "FFC7CE" } };
        }
      }

      // Linhas de Subtotal (Bold)
      const dataVal = worksheet[XLSX.utils.encode_cell({ c: 0, r: R })]?.v || '';
      if (R > 3 && ['SOL VAGOS', 'SOL AVEIRO', 'SOL OVAR', 'VILAR PARAÍSO'].includes(dataVal)) {
        cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
        cell.s.font = { bold: true, sz: 10 };
      }

      // Linha Total Final
      if (dataVal === 'TOTAL GRUPO') {
        cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "1E293B" } };
      }
    }
  }

  // Merges e Config
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Título
    { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } }, // Vendas
    { s: { r: 2, c: 6 }, e: { r: 2, c: 8 } }, // Transações
    { s: { r: 2, c: 9 }, e: { r: 2, c: 12 } }, // Receita
  ];

  worksheet['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance');
  XLSX.writeFile(workbook, `Performance_${monthLabel.replace(/ /g, '_')}.xlsx`);
}
