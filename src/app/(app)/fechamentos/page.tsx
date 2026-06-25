'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getInitials, currentMonth } from '@/lib/utils'
import type { Fechamento, Cliente, Consultor } from '@/types'
import { Plus, X, Download, Trophy, TrendingUp } from 'lucide-react'

const EMPTY: Partial<Fechamento> = { cliente_id: '', consultor_id: '', data_fechamento: new Date().toISOString().split('T')[0], valor: 0, percentual_comissao: 6, observacoes: '' }

export default function FechamentosPage() {
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [mesRef, setMesRef] = useState(currentMonth())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Fechamento>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [mesRef])

  async function loadData() {
    const [fRes, cliRes, coRes] = await Promise.all([
      supabase.from('fechamentos').select('*, cliente:clientes(nome), consultor:consultores(nome)').eq('mes_referencia', mesRef).order('data_fechamento', { ascending: false }),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('consultores').select('id, nome, meta_mensal').eq('ativo', true).order('nome'),
    ])
    setFechamentos((fRes.data ?? []).map((f: any) => ({ ...f, cliente_nome: f.cliente?.nome, consultor_nome: f.consultor?.nome })))
    setClientes(cliRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const totalValor = fechamentos.reduce((s, f) => s + f.valor, 0)
  const totalComissao = fechamentos.reduce((s, f) => s + (f.valor_comissao ?? 0), 0)
  const ticketMedio = fechamentos.length > 0 ? totalValor / fechamentos.length : 0

  // Ranking
  const rankingMap: Record<string, { nome: string; valor: number; qtd: number; meta: number }> = {}
  fechamentos.forEach(f => {
    if (!f.consultor_id) return
    if (!rankingMap[f.consultor_id]) {
      const co = consultores.find(c => c.id === f.consultor_id)
      rankingMap[f.consultor_id] = { nome: f.consultor_nome ?? '', valor: 0, qtd: 0, meta: co?.meta_mensal ?? 0 }
    }
    rankingMap[f.consultor_id].valor += f.valor
    rankingMap[f.consultor_id].qtd++
  })
  const ranking = Object.entries(rankingMap).sort((a, b) => b[1].valor - a[1].valor)

  async function handleSave() {
    setSaving(true)
    await supabase.from('fechamentos').insert([form])
    // Atualizar status do cliente para Fechado
    if (form.cliente_id) {
      await supabase.from('clientes').update({ status: 'Fechado' }).eq('id', form.cliente_id)
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    loadData()
  }

  function upd(k: keyof Fechamento, v: any) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div>
      {/* Controle de mês */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <label className="label mb-0">Mês de referência</label>
          <input type="month" className="input w-40" value={mesRef} onChange={e => setMesRef(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn-outline"><Download size={14} /> Exportar PDF</button>
          <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}><Plus size={15} /> Registrar Fechamento</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card red bg-[#C8232B] border-[#C8232B] py-3">
          <div className="text-xs text-red-200 uppercase tracking-wide">Fechamentos</div>
          <div className="text-2xl font-medium text-white">{fechamentos.length}</div>
          <div className="text-xs text-red-200">{mesRef}</div>
        </div>
        <div className="card py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Valor total</div>
          <div className="text-xl font-medium text-gray-900">{formatCurrency(totalValor)}</div>
        </div>
        <div className="card py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Ticket médio</div>
          <div className="text-xl font-medium text-gray-900">{formatCurrency(ticketMedio)}</div>
        </div>
        <div className="card py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Comissão total</div>
          <div className="text-xl font-medium text-gray-900">{formatCurrency(totalComissao)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tabela */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Consultor</th>
                  <th className="table-th hidden md:table-cell">Data</th>
                  <th className="table-th">Valor</th>
                  <th className="table-th hidden md:table-cell">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {fechamentos.length === 0 && (
                  <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Nenhum fechamento neste mês.</td></tr>
                )}
                {fechamentos.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{f.cliente_nome ?? '-'}</td>
                    <td className="table-td text-gray-500">{f.consultor_nome ?? '-'}</td>
                    <td className="table-td hidden md:table-cell text-gray-400 text-xs">{formatDate(f.data_fechamento)}</td>
                    <td className="table-td font-medium text-[#C8232B]">{formatCurrency(f.valor)}</td>
                    <td className="table-td hidden md:table-cell text-gray-500 text-sm">{formatCurrency(f.valor_comissao ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking */}
        <div className="card">
          <div className="section-title flex items-center gap-2"><Trophy size={14} className="text-[#C8232B]" /> Ranking de Consultores</div>
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sem dados.</p>
          ) : (
            ranking.map(([id, r], i) => (
              <div key={id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <span className={`text-base font-medium w-5 text-center ${i === 0 ? 'text-[#C8232B]' : 'text-gray-300'}`}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: i === 0 ? '#C8232B' : i === 1 ? '#3a3a3a' : '#888' }}>
                  {getInitials(r.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{r.nome}</div>
                  <div className="text-xs text-gray-400">{r.qtd} fechamento{r.qtd !== 1 ? 's' : ''}</div>
                  {r.meta > 0 && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-full bg-[#C8232B] rounded-full" style={{ width: `${Math.min((r.valor / r.meta) * 100, 100)}%` }} />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-[#C8232B] flex-shrink-0">{formatCurrency(r.valor)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Registrar Fechamento</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Cliente *</label>
                <select className="select" value={form.cliente_id ?? ''} onChange={e => upd('cliente_id', e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Consultor *</label>
                <select className="select" value={form.consultor_id ?? ''} onChange={e => upd('consultor_id', e.target.value)}>
                  <option value="">Selecione o consultor</option>
                  {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data</label>
                  <input type="date" className="input" value={form.data_fechamento ?? ''} onChange={e => upd('data_fechamento', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor (R$) *</label>
                  <input type="number" className="input" value={form.valor ?? 0} onChange={e => upd('valor', parseFloat(e.target.value))} min={0} />
                </div>
                <div>
                  <label className="label">% Comissão</label>
                  <input type="number" className="input" value={form.percentual_comissao ?? 6} onChange={e => upd('percentual_comissao', parseFloat(e.target.value))} step={0.1} min={0} max={100} />
                </div>
                <div className="flex items-end pb-0">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Comissão</div>
                    <div className="text-base font-medium text-[#C8232B]">
                      {formatCurrency((form.valor ?? 0) * (form.percentual_comissao ?? 6) / 100)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.observacoes ?? ''} onChange={e => upd('observacoes', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.cliente_id || !form.valor}>{saving ? 'Salvando...' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
