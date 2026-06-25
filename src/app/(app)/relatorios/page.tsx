'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { formatCurrency, currentMonth, STATUS_KANBAN } from '@/lib/utils'
import { Download } from 'lucide-react'

export default function RelatoriosPage() {
  const [mesRef, setMesRef] = useState(currentMonth())
  const [statusData, setStatusData] = useState<{ status: string; total: number }[]>([])
  const [consultorData, setConsultorData] = useState<{ nome: string; valor: number; qtd: number }[]>([])
  const [origemData, setOrigemData] = useState<{ name: string; value: number }[]>([])
  const [atrasadasData, setAtrasadasData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadRelatorios() }, [mesRef])

  async function loadRelatorios() {
    setLoading(true)
    const [cliRes, fecRes, tarRes] = await Promise.all([
      supabase.from('clientes').select('status, origem_lead'),
      supabase.from('fechamentos').select('valor, consultor_id, consultor:consultores(nome)').eq('mes_referencia', mesRef),
      supabase.from('tarefas').select('status, data_vencimento').neq('status', 'Concluído'),
    ])

    // Clientes por status
    const clientes = cliRes.data ?? []
    const statusMap: Record<string, number> = {}
    clientes.forEach(c => { statusMap[c.status] = (statusMap[c.status] ?? 0) + 1 })
    setStatusData(STATUS_KANBAN.map(s => ({ status: s, total: statusMap[s] ?? 0 })).filter(d => d.total > 0))

    // Origem
    const origemMap: Record<string, number> = {}
    clientes.forEach(c => { if (c.origem_lead) origemMap[c.origem_lead] = (origemMap[c.origem_lead] ?? 0) + 1 })
    setOrigemData(Object.entries(origemMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

    // Fechamentos por consultor
    const fec = fecRes.data ?? []
    const coMap: Record<string, { nome: string; valor: number; qtd: number }> = {}
    fec.forEach((f: any) => {
      const id = f.consultor_id ?? 'sem'
      const nome = f.consultor?.nome ?? 'Sem consultor'
      if (!coMap[id]) coMap[id] = { nome, valor: 0, qtd: 0 }
      coMap[id].valor += f.valor ?? 0
      coMap[id].qtd++
    })
    setConsultorData(Object.values(coMap).sort((a, b) => b.valor - a.valor))

    setLoading(false)
  }

  const CORES = ['#C8232B', '#3a3a3a', '#6b6b6b', '#888888', '#aaaaaa', '#cccccc']

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <label className="label mb-0">Mês</label>
          <input type="month" className="input w-36" value={mesRef} onChange={e => setMesRef(e.target.value)} />
        </div>
        <button className="btn-outline"><Download size={14} /> Exportar Excel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Clientes por status */}
        <div className="card">
          <div className="section-title">Pipeline — Clientes por Etapa</div>
          {statusData.length === 0 && !loading && <p className="text-sm text-gray-400 text-center py-6">Sem dados.</p>}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(v: any) => [v, 'Clientes']} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {statusData.map((_, i) => <Cell key={i} fill={i === 0 ? '#C8232B' : '#e8e8e8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vendas por consultor */}
        <div className="card">
          <div className="section-title">Vendas por Consultor — {mesRef}</div>
          {consultorData.length === 0 && !loading && <p className="text-sm text-gray-400 text-center py-6">Sem fechamentos neste mês.</p>}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={consultorData} margin={{ left: 8, right: 16 }}>
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [formatCurrency(v), 'Valor']} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {consultorData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origem dos leads */}
        <div className="card">
          <div className="section-title">Origem dos Leads (total)</div>
          {origemData.length === 0 && !loading && <p className="text-sm text-gray-400 text-center py-6">Sem dados.</p>}
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={origemData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {origemData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo textual */}
        <div className="card">
          <div className="section-title">Resumo do Mês — {mesRef}</div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Total de clientes ativos</span>
              <span className="text-sm font-medium text-gray-900">{statusData.reduce((s, d) => s + d.total, 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Fechamentos no mês</span>
              <span className="text-sm font-medium text-[#C8232B]">{consultorData.reduce((s, d) => s + d.qtd, 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Faturamento no mês</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(consultorData.reduce((s, d) => s + d.valor, 0))}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Principal origem de leads</span>
              <span className="text-sm font-medium text-gray-900">{origemData[0]?.name ?? '-'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Melhor consultor do mês</span>
              <span className="text-sm font-medium text-gray-900">{consultorData[0]?.nome ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
