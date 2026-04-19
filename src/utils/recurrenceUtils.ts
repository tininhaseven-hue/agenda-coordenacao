import { CustomTask } from '@/types';
import { formatDateKey } from './routineUtils';

/**
 * Determina se uma tarefa extra deve aparecer numa data específica
 */
export function isCustomTaskVisibleOn(task: CustomTask, date: Date): boolean {
  if (!task.recurrence || task.recurrence === 'NONE') {
    const d = formatDateKey(date);
    if (task.endDate) {
      return d >= (task.startDate || '') && d <= task.endDate;
    }
    return task.startDate === d;
  }

  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // Se o dia atual é anterior à data de início, não aparece
  if (task.startDate && formatDateKey(date) < task.startDate) {
    return false;
  }

  switch (task.recurrence) {
    case 'WEEKLY':
      return !!(task.daysOfWeek && task.daysOfWeek.includes(dayOfWeek));
    
    case 'MONTHLY':
      return task.dayOfMonth === dayOfMonth;
    
    case 'LAST_DAY_OF_MONTH': {
      const lastDay = new Date(year, month + 1, 0).getDate();
      return dayOfMonth === lastDay;
    }

    case 'QUARTERLY': 
    case 'QUADRIMESTER':
    case 'SEMI_ANNUAL':
    case 'ANNUAL': {
      if (!task.startDate) return false;
      const start = new Date(task.startDate);
      const startDay = start.getDate();
      
      // Deve bater no mesmo dia do mês
      if (dayOfMonth !== startDay) {
        // Exceção: Se o dia de início for 31 e este mês só tiver 30, aceitamos o dia 30?
        // Para simplificar, vamos exigir o mesmo dia, a menos que seja LAST_DAY_OF_MONTH explicitamente.
        // Mas vamos verificar o intervalo de meses.
        return false;
      }

      const diffMonths = (year - start.getFullYear()) * 12 + (month - start.getMonth());
      const interval = 
        task.recurrence === 'QUARTERLY' ? 3 :
        task.recurrence === 'QUADRIMESTER' ? 4 :
        task.recurrence === 'SEMI_ANNUAL' ? 6 :
        task.recurrence === 'ANNUAL' ? 12 : 1;

      return diffMonths >= 0 && diffMonths % interval === 0;
    }

    default:
      return false;
  }
}
