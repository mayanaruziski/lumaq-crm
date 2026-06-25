// ============================================================
// LUMAQ CRM — Tipos TypeScript
// ============================================================

export type StatusCliente =
  | 'Lead recebido'
  | 'Primeiro atendimento'
  | 'Medida técnica'
  | 'Desenvolvimento de projeto'
  | 'Apresentação'
  | 'Negociação'
  | 'Fechado'
  | 'Conferência final'
  | 'Liberação para produção'
  | 'Produção'
  | 'Montagem'
  | 'Entregue'

export type StatusTarefa = 'Não iniciado' | 'Em andamento' | 'Aguardando' | 'Concluído' | 'Atrasado'
export type Prioridade = 'Alta' | 'Média' | 'Baixa'
export type OrigemLead = 'Instagram' | 'Facebook' | 'Google' | 'Indicação' | 'Showroom' | 'WhatsApp' | 'Outros'
export type TipoTarefa =
  | 'Medida' | 'Desenvolvimento de projeto' | 'Apresentação' | 'Negociação'
  | 'Conferência final' | 'Liberação para produção' | 'Documentação'
  | 'Pós-venda' | 'Financeiro' | 'Reunião' | 'Treinamento'
export type TipoEvento = 'Visita' | 'Medida' | 'Apresentação' | 'Reunião' | 'Conferência final' | 'Liberação' | 'Outro'
export type TipoDocumento = 'Contrato' | 'Projeto PDF' | 'Renderização' | 'Medidas' | 'Conferência final' | 'Comprovante' | 'Foto' | 'Outro'

export interface Consultor {
  id: string
  nome: string
  email?: string
  telefone?: string
  meta_mensal: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  whatsapp?: string
  email?: string
  endereco?: string
  cidade?: string
  bairro?: string
  origem_lead?: OrigemLead
  consultor_id?: string
  consultor_nome?: string
  status: StatusCliente
  temperatura?: 'Frio' | 'Morno' | 'Quente'
  valor_estimado?: number
  observacoes?: string
  data_entrada: string
  created_at: string
  updated_at: string
}

export interface Tarefa {
  id: string
  titulo: string
  tipo?: TipoTarefa
  cliente_id?: string
  cliente_nome?: string
  responsavel_id?: string
  responsavel_nome?: string
  data_inicio?: string
  hora_inicio?: string
  tempo_estimado?: string
  prioridade: Prioridade
  data_vencimento?: string
  data_conclusao?: string
  observacoes?: string
  status: StatusTarefa
  created_at: string
  updated_at: string
}

export interface Evento {
  id: string
  titulo: string
  tipo?: TipoEvento
  cliente_id?: string
  cliente_nome?: string
  consultor_id?: string
  consultor_nome?: string
  data_inicio: string
  data_fim?: string
  local?: string
  descricao?: string
  created_at: string
}

export interface Fechamento {
  id: string
  cliente_id: string
  cliente_nome?: string
  consultor_id?: string
  consultor_nome?: string
  data_fechamento: string
  valor: number
  percentual_comissao: number
  valor_comissao: number
  observacoes?: string
  mes_referencia: string
  created_at: string
}

export interface Documento {
  id: string
  cliente_id: string
  tipo: TipoDocumento
  nome_arquivo: string
  storage_path: string
  tamanho_bytes?: number
  created_at: string
}

export interface DashboardStats {
  projetos_andamento: number
  medidas_agendadas: number
  apresentacoes_agendadas: number
  negociacoes_abertas: number
  conferencias_pendentes: number
  liberacoes_pendentes: number
  fechamentos_mes: number
  faturamento_mes: number
  meta_mes: number
  tarefas_atrasadas: number
}

export interface RankingConsultor {
  consultor_id: string
  consultor_nome: string
  total_fechamentos: number
  total_valor: number
  total_comissao: number
  meta_mensal: number
}

// Database types para Supabase (simplificado)
export interface Database {
  public: {
    Tables: {
      consultores: { Row: Consultor; Insert: Partial<Consultor>; Update: Partial<Consultor> }
      clientes: { Row: Cliente; Insert: Partial<Cliente>; Update: Partial<Cliente> }
      tarefas: { Row: Tarefa; Insert: Partial<Tarefa>; Update: Partial<Tarefa> }
      eventos: { Row: Evento; Insert: Partial<Evento>; Update: Partial<Evento> }
      fechamentos: { Row: Fechamento; Insert: Partial<Fechamento>; Update: Partial<Fechamento> }
      documentos: { Row: Documento; Insert: Partial<Documento>; Update: Partial<Documento> }
    }
    Views: {
      clientes_com_consultor: { Row: Cliente }
      resumo_fechamentos: { Row: RankingConsultor & { mes_referencia: string } }
      tarefas_atrasadas: { Row: Tarefa & { cliente_nome: string; consultor_nome: string } }
    }
  }
}
