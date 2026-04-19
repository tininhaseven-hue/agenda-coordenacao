import { VisitType, VisitChecklistItem } from '@/types';

export const VISIT_TEMPLATES: Record<VisitType, string[]> = {
  'ESTRUTURADO': [
    'Analisar projeção de vendas e EBITDA',
    'Fazer auditoria inventário',
    'Fazer auditoria cofre/ depósitos',
    'Verificar quadro de comunicação',
    'Verificar planos de formação',
    'Verificar plano de manutenção',
    'Verificar planos de ação auditorias / GES',
    'Verificar horários (horário semanal N+1 afixado, horários lineares assinados)',
    'Verificar cumprimento do plano de férias',
    'Reconhecer a equipa e comemorar os bons resultados'
  ],
  'CURTA_DURACAO': [
    'Verificar limpeza: exterior; wc\'s clientes; sala',
    'Verificar apresentação pessoal dos colaboradores',
    'Planeamento da produção / exposição ajustada às vendas',
    'Regras de higiene e segurança alimentar implementadas',
    'Regras de segurança e saúde no trabalho implementadas',
    'Produtos de venda estão disponíveis (não há ruturas)',
    'Materiais de marketing estão corretamente colocados',
    'Tarefas de turno realizadas; objetivos diários definidos (vendas; venda sugestiva)',
    'Equipa colocada de acordo com o definido',
    'Equipa cumpre standards de atendimento',
    'Ambiente de sala (iluminação, música, temperatura)',
    'Plano On Off implementado'
  ]
};

export function getChecklistForType(type: VisitType): VisitChecklistItem[] {
  return VISIT_TEMPLATES[type].map(text => ({
    id: `vitem_${Math.random().toString(36).substr(2, 9)}`,
    text,
    status: 'PENDENTE',
    observations: '',
  }));
}
