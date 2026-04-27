import { useState, useEffect } from 'react';
import { ALL_STORES, DayKPIData, StoreBudget, PerformanceKPIs } from '@/types';

export function usePerformance(currentMonthYear: string) { // Format: YYYY-MM
  const [dailyData, setDailyData] = useState<Record<string, Record<string, DayKPIData>>>({});
  const [budgets, setBudgets] = useState<Record<string, StoreBudget>>({});
  const [monthlyNotes, setMonthlyNotes] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sincronização Inteligente com a Nuvem
    const performSync = async () => {
      try {
        const { fullTwoWaySync } = await import('@/utils/syncUtils');
        await fullTwoWaySync();
      } catch (e) {
        console.error("Erro na sincronização inicial usePerformance:", e);
      }
    };
    performSync();
  }, []);

  useEffect(() => {
    // Load budgets
    const storedBudgets = localStorage.getItem(`budgets_${currentMonthYear}`);
    if (storedBudgets) setBudgets(JSON.parse(storedBudgets));

    // Load monthly notes
    const storedNotes = localStorage.getItem(`notes_${currentMonthYear}`);
    if (storedNotes) setMonthlyNotes(storedNotes);

    // Load month data
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`sales_${currentMonthYear}`));
    const monthData: Record<string, Record<string, DayKPIData>> = {};
    keys.forEach(k => {
      const date = k.replace('sales_', '');
      const val = localStorage.getItem(k);
      if (val) monthData[date] = JSON.parse(val);
    });
    setDailyData(monthData);
    setIsLoaded(true);
  }, [currentMonthYear]);

  const updateDailySales = (date: string, store: string, data: DayKPIData) => {
    setDailyData(prev => {
      const dateData = prev[date] || {};
      const updatedDateData = { ...dateData, [store]: data };
      const val = JSON.stringify(updatedDateData);
      localStorage.setItem(`sales_${date}`, val);
      
      const { pushToCloud } = require('@/utils/syncUtils');
      pushToCloud(`sales_${date}`, val);
      
      return { ...prev, [date]: updatedDateData };
    });
  };


  const updateBudget = (store: string, budget: StoreBudget) => {
    const updated = { ...budgets, [store]: budget };
    setBudgets(updated);
    const val = JSON.stringify(updated);
    localStorage.setItem(`budgets_${currentMonthYear}`, val);
    
    const { pushToCloud } = require('@/utils/syncUtils');
    pushToCloud(`budgets_${currentMonthYear}`, val);
  };

  const saveMonthlyNotes = (notes: string) => {
    setMonthlyNotes(notes);
    localStorage.setItem(`notes_${currentMonthYear}`, notes);
    
    const { pushToCloud } = require('@/utils/syncUtils');
    pushToCloud(`notes_${currentMonthYear}`, notes);
  };

  const getDailyTotals = () => {
    const dates = Object.keys(dailyData).sort();
    return dates.map(date => {
      let totalSales = 0;
      let totalTrans = 0;
      Object.values(dailyData[date]).forEach(storeData => {
        totalSales += storeData.sales;
        totalTrans += storeData.transactions;
      });
      return { date, totalSales, totalTrans };
    });
  };

  const getPerformanceKPIs = (): PerformanceKPIs[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Current days in month with data
    const datesWithData = Object.keys(dailyData).sort();
    const daysDecorridos = datesWithData.length || 1;
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return ALL_STORES.map(store => {
      let accumSales = 0;
      let accumTrans = 0;
      
      Object.values(dailyData).forEach(day => {
        if (day[store]) {
          accumSales += day[store].sales;
          accumTrans += day[store].transactions;
        }
      });

      const yesterdayData = dailyData[yesterdayStr]?.[store] || { sales: 0, transactions: 0 };
      const budget = budgets[store] || { monthlySales: 0, monthlyTransactions: 0 };

      const projectedSales = daysDecorridos > 0 ? (accumSales / daysDecorridos) * totalDaysInMonth : 0;
      const avgReceipt = accumTrans > 0 ? accumSales / accumTrans : 0;
      const budgetReceipt = budget.monthlyTransactions > 0 ? budget.monthlySales / budget.monthlyTransactions : 0;

      return {
        store,
        yesterdaySales: yesterdayData.sales,
        accumMonthSales: accumSales,
        projectedSales,
        budgetSales: budget.monthlySales,
        yesterdayTransactions: yesterdayData.transactions,
        accumMonthTransactions: accumTrans,
        budgetTransactions: budget.monthlyTransactions,
        averageReceipt: avgReceipt,
        budgetReceipt: budgetReceipt
      };
    });
  };

  const seedAprilData = () => {
    const data: Record<string, Record<string, DayKPIData>> = {
      "2026-04-01": {
        "Aveiro Norte": { "sales": 639.84, "transactions": 132 },
        "Aveiro Sul": { "sales": 458.86, "transactions": 109 },
        "Ovar Norte": { "sales": 88.18, "transactions": 39 },
        "Ovar Sul": { "sales": 196.19, "transactions": 65 },
        "Vagos Norte": { "sales": 1142.34, "transactions": 222 },
        "Vagos Sul": { "sales": 682.67, "transactions": 161 },
        "Vilar do Paraíso Norte": { "sales": 80.59, "transactions": 48 }
      },
      "2026-04-02": {
        "Aveiro Norte": { "sales": 926.12, "transactions": 191 },
        "Aveiro Sul": { "sales": 686.36, "transactions": 137 },
        "Ovar Norte": { "sales": 232.90, "transactions": 74 },
        "Ovar Sul": { "sales": 178.32, "transactions": 74 },
        "Vagos Norte": { "sales": 1914.97, "transactions": 350 },
        "Vagos Sul": { "sales": 904.85, "transactions": 166 },
        "Vilar do Paraíso Norte": { "sales": 67.54, "transactions": 44 }
      },
      "2026-04-03": {
        "Aveiro Norte": { "sales": 1071.21, "transactions": 185 },
        "Aveiro Sul": { "sales": 657.55, "transactions": 128 },
        "Ovar Norte": { "sales": 140.07, "transactions": 36 },
        "Ovar Sul": { "sales": 195.67, "transactions": 40 },
        "Vagos Norte": { "sales": 2041.47, "transactions": 316 },
        "Vagos Sul": { "sales": 838.76, "transactions": 193 },
        "Vilar do Paraíso Norte": { "sales": 15.69, "transactions": 8 }
      },
      "2026-04-04": {
        "Aveiro Norte": { "sales": 605.74, "transactions": 121 },
        "Aveiro Sul": { "sales": 508.08, "transactions": 115 },
        "Ovar Norte": { "sales": 166.30, "transactions": 53 },
        "Ovar Sul": { "sales": 148.67, "transactions": 53 },
        "Vagos Norte": { "sales": 954.73, "transactions": 189 },
        "Vagos Sul": { "sales": 588.57, "transactions": 163 },
        "Vilar do Paraíso Norte": { "sales": 55.37, "transactions": 21 }
      },
      "2026-04-05": {
        "Aveiro Norte": { "sales": 676.36, "transactions": 139 },
        "Aveiro Sul": { "sales": 870.45, "transactions": 188 },
        "Ovar Norte": { "sales": 128.01, "transactions": 42 },
        "Ovar Sul": { "sales": 216.54, "transactions": 59 },
        "Vagos Norte": { "sales": 1058.19, "transactions": 189 },
        "Vagos Sul": { "sales": 1136.98, "transactions": 251 },
        "Vilar do Paraíso Norte": { "sales": 41.62, "transactions": 19 }
      },
      "2026-04-06": {
        "Aveiro Norte": { "sales": 484.61, "transactions": 111 },
        "Aveiro Sul": { "sales": 755.90, "transactions": 181 },
        "Ovar Norte": { "sales": 69.93, "transactions": 37 },
        "Ovar Sul": { "sales": 174.63, "transactions": 57 },
        "Vagos Norte": { "sales": 818.59, "transactions": 191 },
        "Vagos Sul": { "sales": 811.83, "transactions": 188 },
        "Vilar do Paraíso Norte": { "sales": 49.81, "transactions": 30 }
      },
      "2026-04-07": {
        "Aveiro Norte": { "sales": 525.84, "transactions": 105 },
        "Aveiro Sul": { "sales": 516.77, "transactions": 107 },
        "Ovar Norte": { "sales": 136.78, "transactions": 60 },
        "Ovar Sul": { "sales": 128.05, "transactions": 61 },
        "Vagos Norte": { "sales": 615.70, "transactions": 144 },
        "Vagos Sul": { "sales": 584.36, "transactions": 140 },
        "Vilar do Paraíso Norte": { "sales": 74.46, "transactions": 50 }
      },
      "2026-04-08": {
        "Aveiro Norte": { "sales": 461.38, "transactions": 116 },
        "Aveiro Sul": { "sales": 502.11, "transactions": 120 },
        "Ovar Norte": { "sales": 182.27, "transactions": 57 },
        "Ovar Sul": { "sales": 120.69, "transactions": 57 },
        "Vagos Norte": { "sales": 757.68, "transactions": 163 },
        "Vagos Sul": { "sales": 591.20, "transactions": 143 },
        "Vilar do Paraíso Norte": { "sales": 66.73, "transactions": 35 }
      },
      "2026-04-09": {
        "Aveiro Norte": { "sales": 435.67, "transactions": 116 },
        "Aveiro Sul": { "sales": 468.27, "transactions": 122 },
        "Ovar Norte": { "sales": 119.52, "transactions": 54 },
        "Ovar Sul": { "sales": 206.53, "transactions": 72 },
        "Vagos Norte": { "sales": 735.62, "transactions": 172 },
        "Vagos Sul": { "sales": 447.62, "transactions": 111 },
        "Vilar do Paraíso Norte": { "sales": 63.20, "transactions": 40 }
      },
      "2026-04-10": {
        "Aveiro Norte": { "sales": 470.32, "transactions": 116 },
        "Aveiro Sul": { "sales": 474.64, "transactions": 113 },
        "Ovar Norte": { "sales": 133.53, "transactions": 57 },
        "Ovar Sul": { "sales": 140.72, "transactions": 57 },
        "Vagos Norte": { "sales": 869.93, "transactions": 169 },
        "Vagos Sul": { "sales": 578.90, "transactions": 125 },
        "Vilar do Paraíso Norte": { "sales": 65.42, "transactions": 40 }
      },
      "2026-04-11": {
        "Aveiro Norte": { "sales": 469.20, "transactions": 106 },
        "Aveiro Sul": { "sales": 421.36, "transactions": 94 },
        "Ovar Norte": { "sales": 108.82, "transactions": 28 },
        "Ovar Sul": { "sales": 126.39, "transactions": 43 },
        "Vagos Norte": { "sales": 636.94, "transactions": 135 },
        "Vagos Sul": { "sales": 442.51, "transactions": 110 },
        "Vilar do Paraíso Norte": { "sales": 42.08, "transactions": 14 }
      },
      "2026-04-12": {
        "Aveiro Norte": { "sales": 448.78, "transactions": 111 },
        "Aveiro Sul": { "sales": 412.77, "transactions": 92 },
        "Ovar Norte": { "sales": 61.66, "transactions": 29 },
        "Ovar Sul": { "sales": 96.90, "transactions": 42 },
        "Vagos Norte": { "sales": 613.61, "transactions": 139 },
        "Vagos Sul": { "sales": 462.19, "transactions": 99 },
        "Vilar do Paraíso Norte": { "sales": 16.17, "transactions": 10 }
      }
    };

    Object.entries(data).forEach(([date, dayData]) => {
      localStorage.setItem(`sales_${date}`, JSON.stringify(dayData));
    });
    
    // Refresh state
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`sales_${currentMonthYear}`));
    const monthData: Record<string, Record<string, DayKPIData>> = {};
    keys.forEach(k => {
      const d = k.replace('sales_', '');
      monthData[d] = JSON.parse(localStorage.getItem(k) || '{}');
    });
    setDailyData(monthData);
  };

  return { dailyData, budgets, updateDailySales, updateBudget, getPerformanceKPIs, getDailyTotals, monthlyNotes, saveMonthlyNotes, isLoaded, seedAprilData };
}
