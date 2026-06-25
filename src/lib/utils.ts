import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusCliente, StatusTarefa, Prioridade } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDatetime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '-'
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Cores dos status de cliente
export function statusClienteColor(status: StatusCliente): string {
  const map: Record<StatusCliente, string> = {
    'Lead recebido': 'bg-gray-100 text-gray-700',
    'Primeiro atendimento': 'bg-blue-100 text-blue-700',
    'Medida técnica': 'bg-yellow-100 text-yellow-700',
    'Desenvolvimento de projeto': 'bg-purple-100 text-purple-700',
    'Apresentação': 'bg-orange-100 text-orange-700',
    'Negociação': 'bg-amber-100 text-amber-700',
    'Fechado': 'bg-green-100 text-green-700',
    'Conferência final': 'bg-teal-100 text-teal-700',
    'Liberação para produção': 'bg-red-100 text-red-700',
    'Produção': 'bg-indigo-100 text-indigo-700',
    'Montagem': 'bg-cyan-100 text-cyan-700',
    'Entregue': 'bg-emerald-100 text-emerald-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// Cores dos status de tarefa
export function statusTarefaColor(status: StatusTarefa): string {
  const map: Record<StatusTarefa, string> = {
    'Não iniciado': 'bg-gray-100 text-gray-600',
    'Em andamento': 'bg-blue-100 text-blue-700',
    'Aguardando': 'bg-yellow-100 text-yellow-700',
    'Concluído': 'bg-green-100 text-green-700',
    'Atrasado': 'bg-red-100 text-[#C8232B]',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function prioridadeColor(p: Prioridade): string {
  const map: Record<Prioridade, string> = {
    Alta: 'bg-red-100 text-[#C8232B]',
    Média: 'bg-amber-100 text-amber-700',
    Baixa: 'bg-gray-100 text-gray-600',
  }
  return map[p]
}

export const STATUS_KANBAN: StatusCliente[] = [
  'Lead recebido',
  'Primeiro atendimento',
  'Medida técnica',
  'Desenvolvimento de projeto',
  'Apresentação',
  'Negociação',
  'Fechado',
  'Conferência final',
  'Liberação para produção',
  'Produção',
  'Montagem',
  'Entregue',
]

export const ORIGENS_LEAD = ['Instagram', 'Facebook', 'Google', 'Indicação', 'Showroom', 'WhatsApp', 'Outros']
export const TIPOS_TAREFA = [
  'Medida', 'Desenvolvimento de projeto', 'Apresentação', 'Negociação',
  'Conferência final', 'Liberação para produção', 'Documentação',
  'Pós-venda', 'Financeiro', 'Reunião', 'Treinamento',
]
export const TIPOS_EVENTO = ['Visita', 'Medida', 'Apresentação', 'Reunião', 'Conferência final', 'Liberação', 'Outro']
export const TIPOS_DOCUMENTO = ['Contrato', 'Projeto PDF', 'Renderização', 'Medidas', 'Conferência final', 'Comprovante', 'Foto', 'Outro']
