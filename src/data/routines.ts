import { Routine } from '../types';

export const routines: Routine[] = [
  {
    id: 'd1',
    title: 'Analisar vendas (vendas, transações, receita média, projeção, quota)',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [1]
  },
  {
    id: 'd2',
    title: 'Analisar GES (nr. questionários, comentários)',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDaysOfWeek: [5]
  },
  {
    id: 'd3',
    title: 'Analisar indicadores de serviço por segmento',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [5]
  },
  {
    id: 'd4',
    title: 'Analisar venda sugestiva',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [1]
  },
  {
    id: 'd5',
    title: 'Analisar cartão continente (% clientes fidelizados)',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [1]
  },
  {
    id: 's1',
    title: 'Analisar KPI\'s e definir ações para combater desvios (vendas, CEVC, produtividade)',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [2]
  },
  {
    id: 's2',
    title: 'Analisar dias de stock/ encomendadas',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [1]
  },
  {
    id: 's4',
    title: 'Verificar registos MyHaccp',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDaysOfWeek: [1]
  },
  {
    id: 's5',
    title: 'Analisar gastos gerais',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [2]
  },
  {
    id: 's8',
    title: 'Ajustar/afixar horário semana n+2',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Recursos Humanos (Pessoas)', visibleDaysOfWeek: [5]
  },
  {
    id: 'm2',
    title: 'Analisar contas de exploração',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Resultados e Finanças', visibleDay: 10
  },
  {
    id: 'm3',
    title: 'Verificar responsabilidades assumidas',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 10
  },
  {
    id: 'm4',
    title: 'Analisar qualitativos (auditorias, reclamações, rotação)',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 10
  },
  {
    id: 'm5',
    title: 'Atualizar mapa Know-how (desvios face ao teórico); desencadear ações',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 8, description: 'Atualizar o mapa de know-how = rever o quadro/matriz de competências da equipa, para perceber quem sabe fazer o quê.\n\nDesvios face ao teórico = identificar diferenças entre o que deveria acontecer no papel e o que está realmente a acontecer na prática. Por exemplo: uma função exige determinado conhecimento, mas a colaboradora ainda não o domina totalmente.\n\nDesencadear ações = tomar medidas para corrigir esses desvios. Por exemplo: dar formação, reforçar acompanhamento, redistribuir tarefas, definir plano de melhoria.\n\nEm resumo: verificar se as competências reais da equipa estão de acordo com o esperado e, se não estiverem, avançar com ações para corrigir.'
  },
  {
    id: 'm6',
    title: 'Verificar planos de formação/ certificação e planos de carreira',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 20
  },
  {
    id: 'm7',
    title: 'Validar horário mês seguinte',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 25
  },
  {
    id: 'm8',
    title: 'Reunir com RU\'s (partilhar resultados da área de coordenação)',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 18, visibleMonth: 1
  },
  {
    id: 'a3',
    title: 'Elaborar PPO (novembro)',
    group: 'FREQUÊNCIA',
    category: 'ANUAL',
    area: 'Resultados e Finanças', visibleDay: 2, visibleMonth: 11
  },
  {
    id: 'a4',
    title: 'Validar planos de férias (dezembro)',
    group: 'FREQUÊNCIA',
    category: 'ANUAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 8, visibleMonth: 12
  },
  {
    id: 'o_c4',
    title: 'Avaliar concorrência',
    group: 'OUTRAS ROTINAS',
    category: 'ANUAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 3, visibleMonth: 10
  },
  {
    id: 'ap_e3',
    title: 'Fazer auditoria cofre/ depósitos',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 20
  },
  {
    id: 'ap_e4',
    title: 'Verificar quadro de comunicação( Afixação obrigatória)',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'TRIMESTRAL',
    area: 'Recursos Humanos (Pessoas)', visibleSpecificDates: [
      { month: 1, day: 16 },
      { month: 4, day: 16 },
      { month: 7, day: 16 },
      { month: 10, day: 16 }
    ]
  },
  {
    id: 'ap_e7',
    title: 'Verificar planos de ação auditorias',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDay: 20
  },
  {
    id: 'ap_c3',
    title: 'Planeamento da produção/ exposição ajustada às vendas',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 20
  },
  {
    id: 'ap_c4',
    title: 'Regras de higiene e segurança alimentar implementadas- analisar',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDay: 21
  },
  {
    id: 'ap_c5',
    title: 'Regras de segurança e saúde no trabalho implementadas - analisar',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDay: 22
  },
  {
    id: 'ap_c6',
    title: 'Produtos de venda estão disponíveis (não há ruturas)',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [5]
  },
  {
    id: 'ap_c7',
    title: 'Materiais de marketing estão corretamente colocados',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 20
  },
  {
    id: 'ap_c10',
    title: 'Equipa cumpre standards de atendimento - analisar',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDay: 23
  },
  {
    id: 'ap_c11',
    title: 'Ambiente de sala (iluminação, música, temperatura) -analisar',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'MENSAL',
    area: 'Qualidade, Higiene e Segurança (HACCP)', visibleDay: 24
  },
  {
    id: 'ap_c12',
    title: 'Plano On Off implementado Analisar',
    group: 'ACOMPANHAMENTO PRESENCIAL',
    category: 'TRIMESTRAL',
    area: 'Manutenção', visibleSpecificDates: [
      { month: 1, day: 14 },
      { month: 4, day: 14 },
      { month: 7, day: 14 },
      { month: 10, day: 14 }
    ]
  },
  {
    id: 'dir_d8',
    title: 'Analisar inventário de produtos críticos',
    group: 'FREQUÊNCIA',
    category: 'DIÁRIA',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [2]
  },
  {
    id: 'dir_s2',
    title: 'Verificar conciliações bancárias',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [3]
  },
  {
    id: 'dir_s3',
    title: 'Conferir cofre',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDay: 25
  },
  {
    id: 'dir_s4',
    title: 'Verificar inventário',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Resultados e Finanças', visibleDaysOfWeek: [2]
  },
  {
    id: 'dir_s6',
    title: 'Verificar processos de formação',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Recursos Humanos (Pessoas)', visibleDaysOfWeek: [4]
  },
  {
    id: 'dir_s8',
    title: 'Planear encomendas',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Gestão Operacional e Vendas', visibleDaysOfWeek: [5]
  },
  {
    id: 'dir_m1',
    title: 'Ler lembretes do Goal/RH - fim de contratos, vistos a caducar',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 16
  },
  {
    id: 'dir_m2',
    title: 'Verificar marcação de exames médicos',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 23
  },
  {
    id: 'dir_m5',
    title: 'Garantir fecho Goal/RH',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)'
  },
  {
    id: 'dir_m8',
    title: 'Verificar cumprimento plano de manutenção mês n-1',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Manutenção', visibleDay: 26
  },
  {
    id: 'dir_m9',
    title: 'Preparar reunião com Coordenador',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Gestão Operacional e Vendas', visibleDay: 12
  },
  {
    id: 'dir_m10',
    title: 'Comunicar subsidio de alimentação',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleSpecificDates: [
      { month: 1, day: 25 },
      { month: 1, day: 31 },
      { month: 2, day: 25 },
      { month: 2, day: 28 },
      { month: 3, day: 25 },
      { month: 3, day: 31 },
      { month: 4, day: 25 },
      { month: 4, day: 30 },
      { month: 5, day: 25 },
      { month: 5, day: 31 },
      { month: 6, day: 25 },
      { month: 6, day: 30 },
      { month: 7, day: 25 },
      { month: 7, day: 31 },
      { month: 8, day: 25 },
      { month: 8, day: 31 },
      { month: 9, day: 25 },
      { month: 9, day: 30 },
      { month: 10, day: 25 },
      { month: 10, day: 31 },
      { month: 11, day: 25 },
      { month: 11, day: 30 },
      { month: 12, day: 25 },
      { month: 12, day: 31 }
    ]
  },
  {
    id: 'dir_o_p2',
    title: 'Planear formação da unidade; garantir a sua execução actualizar horas de Formação',
    group: 'FREQUÊNCIA',
    category: 'MENSAL',
    area: 'Recursos Humanos (Pessoas)', visibleDay: 28
  },
  {
    id: 'dir_o_r1',
    title: 'Gerir Iberdesk (pedidos; reclamações; aprovação faturas)',
    group: 'FREQUÊNCIA',
    category: 'SEMANAL',
    area: 'Manutenção', visibleDaysOfWeek: [5]
  },
  {
    id: 'dir_o_r2',
    title: 'Alterar códigos cofres e alarme',
    group: 'FREQUÊNCIA',
    category: 'TRIMESTRAL',
    area: 'Gestão Operacional e Vendas', visibleSpecificDates: [
      { month: 1, day: 16 },
      { month: 4, day: 16 },
      { month: 7, day: 16 },
      { month: 10, day: 16 }
    ]
  }
];
