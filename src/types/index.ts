export type FrequencyCategory = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'ANUAL' | 'TRIMESTRAL';
export type OutrasRotinasCategory = 'PESSOAS' | 'CLIENTES' | 'VENDAS' | 'RESULTADOS';
export type PresencialCategory = 'ESTRUTURADO/ANUNCIADO' | 'CURTA DURAÇÃO/ NÃO ANUNCIADO';
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'QUADRIMESTER' | 'SEMI_ANNUAL' | 'ANNUAL' | 'LAST_DAY_OF_MONTH';

export type Category = FrequencyCategory | OutrasRotinasCategory | PresencialCategory;
export type Group = 'FREQUÊNCIA' | 'OUTRAS ROTINAS' | 'ACOMPANHAMENTO PRESENCIAL';

export type Area = 
  | 'Gestão Operacional e Vendas' 
  | 'Recursos Humanos (Pessoas)' 
  | 'Qualidade, Higiene e Segurança (HACCP)' 
  | 'Manutenção' 
  | 'Resultados e Finanças';

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface RoutineExecution {
  completed: boolean;
  notes?: string;
  rescheduledTo?: string; // Date string YYYY-MM-DD
  isRescheduled?: boolean; // If this instance came from another day
  checklist?: ChecklistItem[];
  attachmentIds?: string[];
  photo?: string; // Base64 link
  isHidden?: boolean;
}

export interface Routine {
  id: string;
  title: string;
  group: Group;
  category: Category;
  area: Area;
  isCritical?: boolean;
  visibleDaysOfWeek?: number[]; // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  visibleMonth?: number; // 1-12
  visibleDay?: number; // 1-31
  visibleSpecificDates?: { month: number; day: number }[];
  description?: string;
}

export interface CustomTask {
  id: string;
  title: string;
  isCompleted: boolean;
  notes?: string;
  area?: Area;
  checklist?: ChecklistItem[];
  recurrence?: RecurrenceType;
  daysOfWeek?: number[]; // [0, 1, 6] para Domingo, Segunda e Sábado
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate?: string; // YYYY-MM-DD - Base para cálculo de intervalos
  endDate?: string; // YYYY-MM-DD - Fim do período para tarefas de intervalo
  isRecurringDefinition?: boolean;
  photo?: string; // Base64 link
  attachmentIds?: string[];
}

export interface DailyProgress {
  date: string;
  completedRoutineIds: string[];
}

export interface ProjectTask {
  id: string;
  text: string;
  isDone: boolean;
}

export type ProjectType = 'CHECKLIST' | 'MATRIX' | 'PLANNER' | 'INCIDENTS' | 'MAINTENANCE' | 'WORKSPACE' | 'SHOPPING';

export interface PlannerEntry {
  id: string;
  name: string;
  store: string;
  date: string;
  month: number; // 0-11
  year: number;
}

export interface MaintenanceIncident {
  id: string;
  requestDate: string;   // YYYY-MM-DD
  approvalDate: string;  // YYYY-MM-DD
  description: string;
  costExVat: number;
  store: string;
  yearMonth: string;     // "YYYY-MM"
  isHidden?: boolean;
}

export interface MaintenanceTask {
  id: string;
  problem: string;
  entryDate: string;      // YYYY-MM-DD
  measure: string;
  incidentNo: string;
  incidentDate: string;   // YYYY-MM-DD
  resolutionDate: string; // YYYY-MM-DD
  validationDate: string; // YYYY-MM-DD
  amountPaid: number;
  store: string;
  isHidden?: boolean;
}

export interface ShoppingItem {
  id: string;
  description: string;
  quantity: number;
  pricePerBox: number;
  isPurchased: boolean;
  store: string;
  isHidden?: boolean;
}

export interface MatrixRow {
  id: string;
  name: string;
  hours?: number;
}

export type BlockType = 'TEXT' | 'CHECKLIST' | 'TABLE' | 'MEDIA' | 'DRAWING';

export interface WorkspaceBlock {
  id: string;
  type: BlockType;
  title: string;
  content?: string; // HTML for TEXT
  checklist?: ProjectTask[];
  table?: { headers: string[], rows: string[][] };
  media?: { id: string, name: string, type: 'AUDIO' | 'IMAGE' | 'PDF', url: string }[];
}

export interface Project {
  id: string;
  title: string;
  area: Area;
  type: ProjectType;
  status: 'Active' | 'Completed';
  tasks: ProjectTask[]; // Para checklists
  matrixConfig?: {
    columns: string[];
    rows: MatrixRow[];
    isTransposed?: boolean;
  };
  plannerData?: Record<string, PlannerEntry[]>; // key="month" (0-11)
  projectNotes?: string;
  incidentData?: Record<string, MaintenanceIncident[]>; // key="store||YYYY-MM"
  incidentBudgets?: Record<string, number>;             // key="store" (annual budget per store)
  maintenanceData?: Record<string, MaintenanceTask[]>;  // key="store" (continuous list)
  workspaceBlocks?: WorkspaceBlock[];
  shoppingData?: Record<string, ShoppingItem[]>;        // key="store"
  createdAt: number;
}

export interface ProjectExecution {
  projectId: string;
  store: string;
  completedTaskIds: string[]; // Para checklists
  matrixData?: Record<string, boolean>; // Para matriz: key="rowId-columnId" value=isDone
  matrixRows?: MatrixRow[]; // Para permitir nomes diferentes por loja
  workspaceBlocks?: WorkspaceBlock[];
}

export type VisitType = 'ESTRUTURADO' | 'CURTA_DURACAO';

export interface VisitChecklistItem {
  id: string;
  text: string;
  status: 'PENDENTE' | 'OK' | 'NAO_OK';
  observations: string;
  photo?: string; // Base64 link
}

export interface Visit {
  id: string;
  store: Store;
  date: string;
  type: VisitType;
  accompaniment: string;
  objective: string;
  notes: string;
  status: 'PLANEADA' | 'CONCLUÍDA';
  checklist: VisitChecklistItem[];
  createdAt: number;
}

export const ALL_STORES = [
  'Vagos Norte',
  'Vagos Sul',
  'Aveiro Norte',
  'Aveiro Sul',
  'Ovar Norte',
  'Ovar Sul',
  'Vilar do Paraíso Norte'
] as const;

export type Store = typeof ALL_STORES[number];

export interface DayKPIData {
  sales: number;
  transactions: number;
}

export interface StoreBudget {
  monthlySales: number;
  monthlyTransactions: number;
}

export interface PerformanceKPIs {
  store: string;
  yesterdaySales: number;
  accumMonthSales: number;
  projectedSales: number;
  budgetSales: number;
  yesterdayTransactions: number;
  accumMonthTransactions: number;
  budgetTransactions: number;
  averageReceipt: number;
  budgetReceipt: number;
}
