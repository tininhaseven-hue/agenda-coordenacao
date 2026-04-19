import { Routine } from '@/types';

/**
 * Formata um objeto Date em string YYYY-MM-DD local
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retorna o nome do dia da semana em Português
 */
export function getPortugueseDayName(date: Date): string {
  const days = [
    'Domingo',
    'Segunda-Feira',
    'Terça-Feira',
    'Quarta-Feira',
    'Quinta-Feira',
    'Sexta-Feira',
    'Sábado'
  ];
  return days[date.getDay()];
}

/**
 * Determina se uma rotina deve ser visível numa data específica de forma "natural"
 * (ignorando reagendamentos)
 */
export function isRoutineVisibleOn(routine: Routine, date: Date): boolean {
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();

  const hasSpecificDate = routine.visibleSpecificDates && routine.visibleSpecificDates.some(d => d.month === month && d.day === dayOfMonth);
  const isExactMonthDay = routine.visibleMonth !== undefined && routine.visibleDay !== undefined && routine.visibleMonth === month && routine.visibleDay === dayOfMonth;
  const isMonthlyDay = routine.visibleDay !== undefined && routine.visibleMonth === undefined && routine.visibleDay === dayOfMonth;
  const isYearlyMonth = routine.visibleMonth !== undefined && routine.visibleDay === undefined && routine.visibleMonth === month;
  
  // Se não tem regras específicas de data, verifica o dia da semana
  const isDefaultDay = (!routine.visibleSpecificDates && routine.visibleMonth === undefined && routine.visibleDay === undefined) && 
                       (!routine.visibleDaysOfWeek || routine.visibleDaysOfWeek.includes(dayOfWeek));

  return !!(hasSpecificDate || isExactMonthDay || isMonthlyDay || isYearlyMonth || isDefaultDay);
}
