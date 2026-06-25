'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getInitials, currentMonth } from '@/lib/utils'
import type { DashboardStats, RankingConsultor, Tarefa, Evento } from '@/types'
import { TrendingUp, Users, Calendar, AlertTriangle, Trophy, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    projetos_andamento: 0, medidas_agendadas: 0, apresentacoes_agendadas: 0,
    negociacoes_abertas: 0, conferencias_pendentes: 0, liberacoes_pendentes: 0,
    fechamentos_mes: 0, faturamento_mes: 0, meta_mes: 210000, tarefas_atrasadas: 0,
  })
  const [ranking, setRanking] = useState<RankingConsultor[]>([])
  const [atrasadas, setAtrasadas] = useState<Tarefa[]>([])
  const [agendaHoje, setAgendaHoje] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const hoje = new Date().toISOString().split('T')[0]
    const mes = currentMonth()

    const [clientesRes, fechamentosRes, tarefasRes, eventosRes, consultoresRes] = await Promise.all([
      supabase.from('clientes').select('status, consultor_id'),
      supabase.from('fechamentos').select('valor, consultor_id').eq('mes_referencia', mes),
      supabase.from('tarefas').select('*').neq('status', 'Concluído').lt('data_vencimento', hoje),
      supabase.from('eventos').select('*, consultor:consultores(nome), cliente:clientes(nome)').gte('data_inicio', hoje + 'T00:00:00').lte('data_inicio', hoje + 'T23:59:59'),
      supabase.from('consultores').select('id, nome, meta_mensal').eq('ativo', true),
    ])

    const clientes = clientesRes.data ?? []
    const fechamentos = fechamentosRes.data ?? []
    const faturamento = fechamentos.reduce((s, f) => s + (f.valor ?? 0), 0)

    setStats({
      projetos_andamento: clientes.filter(c => !['Lead recebido', 'Entregue'].includes(c.status)).length,
      medidas_agendadas: clientes.filter(c => c.status === 'Medida técnica').length,
      apresentacoes_agendadas: clientes.filter(c => c.status === 'Apresentação').length,
      negociacoes_abertas: clientes.filter(c => c.status === 'Negociação').length,
      conferencias_pendentes: clientes.filter(c => c.status === 'Conferência final').length,
      liberacoes_pendentes: clientes.filter(c => c.status === 'Liberação para produção').length,
      fechamentos_mes: fechamentos.length,
      faturamento_mes: faturamento,
      meta_mes: 210000,
      tarefas_atrasadas: tarefasRes.data?.length ?? 0,
    })

    // Ranking consultores
    const consultores = consultoresRes.data ?? []
    const rankingData: RankingConsultor[] = consultores.map(co => {
      const meusFechamentos = fechamentos.filter(f => f.consultor_id === co.id)
      return {
        consultor_id: co.id,
        consultor_nome: co.nome,
        total_fechamentos: meusFechamentos.length,
        total_valor: meusFechamentos.reduce((s, f) => s + (f.valor ?? 0), 0),
        total_comissao: 0,
        meta_mensal: co.meta_mensal,
      }
    }).sort((a, b) => b.total_valor - a.total_valor)
    setRanking(rankingData)

    setAtrasadas((tarefasRes.data ?? []).slice(0, 5) as Tarefa[])
    setAgendaHoje((eventosRes.data ?? []).slice(0, 5) as any[])
    setLoading(false)
  }

  const progressoMeta = Math.min((stats.faturamento_mes / stats.meta_mes) * 100, 100)

  const kpis = [
    { label: 'Fechamentos/Mês', value: stats.fechamentos_mes, sub: 'este mês', red: true },
    { label: 'Faturamento', value: formatCurrency(stats.faturamento_mes), sub: `Meta: ${formatCurrency(stats.meta_mes)}` },
    { label: 'Em Andamento', value: stats.projetos_andamento, sub: 'projetos ativos' },
    { label: 'Medidas', value: stats.medidas_agendadas, sub: 'agendadas' },
    { label: 'Apresentações', value: stats.apresentacoes_agendadas, sub: 'agendadas' },
    { label: 'Negociações', value: stats.negociacoes_abertas, sub: 'em aberto' },
    { label: 'Conf. Finais', value: stats.conferencias_pendentes, sub: 'pendentes' },
    { label: 'Tarefas Atrasadas', value: stats.tarefas_atrasadas, sub: 'requer atenção', alert: stats.tarefas_atrasadas > 0 },
  ]

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className={`rounded-xl p-4 border ${k.red ? 'bg-[#C8232B] border-[#C8232B]' : 'bg-white border-gray-100'}`}>
            <div className={`text-xs uppercase tracking-wide mb-1 ${k.red ? 'text-red-200' : 'text-gray-400'}`}>{k.label}</div>
            <div className={`text-2xl font-medium ${k.red ? 'text-white' : k.alert ? 'text-[#C8232B]' : 'text-gray-900'}`}>{k.value}</div>
            <div className={`text-xs mt-0.5 ${k.red ? 'text-red-200' : 'text-gray-400'}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Barra de meta */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><TrendingUp size={15} className="text-[#C8232B]" /> Progresso da Meta Mensal</span>
          <span className="text-sm font-medium text-gray-900">{progressoMeta.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#C8232B] rounded-full transition-all duration-700" style={{ width: `${progressoMeta}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatCurrency(stats.faturamento_mes)}</span>
          <span>{formatCurrency(stats.meta_mes)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Agenda do dia */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><Calendar size={15} className="text-[#C8232B]" /> Agenda de Hoje</div>
          {agendaHoje.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum evento hoje.</p>
          ) : (
            agendaHoje.map((ev: any) => (
              <div key={ev.id} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="text-xs text-gray-400 w-12 flex-shrink-0 pt-0.5">
                  {ev.data_inicio ? new Date(ev.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
                <div className="w-2 h-2 rounded-full bg-[#C8232B] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{ev.titulo}</div>
                  <div className="text-xs text-gray-400">{ev.tipo} · {ev.local ?? ''}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tarefas atrasadas */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><AlertTriangle size={15} className="text-[#C8232B]" /> Tarefas Atrasadas</div>
          {atrasadas.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma tarefa em atraso.</p>
          ) : (
            atrasadas.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
                <Clock size={14} className="text-[#C8232B] flex-shrink-0" />
                <span className="text-sm text-gray-800 flex-1">{t.titulo}</span>
                <span className="badge bg-red-100 text-[#C8232B]">{t.data_vencimento ? formatDate(t.data_vencimento) : '-'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ranking */}
      <div className="card">
        <div className="section-title flex items-center gap-2"><Trophy size={15} className="text-[#C8232B]" /> Ranking de Consultores — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
        {ranking.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Sem dados este mês.</p>
        ) : (
          ranking.map((r, i) => (
            <div key={r.consultor_id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <span className={`text-base font-medium w-6 text-center ${i === 0 ? 'text-[#C8232B]' : 'text-gray-300'}`}>{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-[#C8232B] flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                style={{ background: i === 0 ? '#C8232B' : i === 1 ? '#3a3a3a' : '#6b6b6b' }}>
                {getInitials(r.consultor_nome)}
              </div>
              <span className="text-sm font-medium text-gray-800 flex-1">{r.consultor_nome}</span>
              <div className="flex-1 max-w-32">
                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div className="h-full bg-[#C8232B] rounded-full" style={{ width: `${ranking[0].total_valor > 0 ? (r.total_valor / ranking[0].total_valor) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="text-sm font-medium text-[#C8232B] min-w-24 text-right">{formatCurrency(r.total_valor)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
