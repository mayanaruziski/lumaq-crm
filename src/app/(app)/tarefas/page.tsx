'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, statusTarefaColor, prioridadeColor, TIPOS_TAREFA } from '@/lib/utils'
import type { Tarefa, Cliente, Consultor, StatusTarefa, Prioridade, TipoTarefa } from '@/types'
import { Plus, X, CheckCircle2, Clock, Filter } from 'lucide-react'

const EMPTY: Partial<Tarefa> = {
  titulo: '', tipo: undefined, cliente_id: undefined, responsavel_id: undefined,
  data_inicio: '', hora_inicio: '', tempo_estimado: '', prioridade: 'Média',
  data_vencimento: '', observacoes: '', status: 'Não iniciado',
}

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPrioridade, setFilterPrioridade] = useState<string>('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Tarefa>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [tRes, cRes, coRes] = await Promise.all([
      supabase.from('tarefas').select(`*, cliente:clientes(nome), responsavel:consultores(nome)`).order('data_vencimento', { ascending: true }),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    const raw = (tRes.data ?? []).map((t: any) => ({
      ...t,
      cliente_nome: t.cliente?.nome,
      responsavel_nome: t.responsavel?.nome,
    }))
    setTarefas(raw)
    setClientes(cRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const filtered = tarefas.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterPrioridade || t.prioridade === filterPrioridade)
  )

  async function handleSave() {
    setSaving(true)
    if (form.id) {
      await supabase.from('tarefas').update(form).eq('id', form.id)
    } else {
      await supabase.from('tarefas').insert([form])
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    loadData()
  }

  async function concluir(id: string) {
    await supabase.from('tarefas').update({ status: 'Concluído', data_conclusao: new Date().toISOString().split('T')[0] }).eq('id', id)
    loadData()
  }

  function upd(k: keyof Tarefa, v: any) { setForm(p => ({ ...p, [k]: v })) }

  const STATUS_LIST: StatusTarefa[] = ['Não iniciado', 'Em andamento', 'Aguardando', 'Concluído', 'Atrasado']

  const counts = {
    total: tarefas.length,
    atrasadas: tarefas.filter(t => t.status === 'Atrasado').length,
    hoje: tarefas.filter(t => t.data_vencimento === new Date().toISOString().split('T')[0]).length,
    concluidas: tarefas.filter(t => t.status === 'Concluído').length,
  }

  return (
    <div>
      {/* Resumo rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Vencem Hoje', value: counts.hoje, alert: counts.hoje > 0 },
          { label: 'Atrasadas', value: counts.atrasadas, alert: counts.atrasadas > 0 },
          { label: 'Concluídas', value: counts.concluidas, green: true },
        ].map((k, i) => (
          <div key={i} className="card py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide">{k.label}</div>
            <div className={`text-2xl font-medium mt-1 ${k.alert ? 'text-[#C8232B]' : k.green ? 'text-green-600' : 'text-gray-900'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="flex gap-2 flex-wrap">
          <select className="select w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select w-40" value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)}>
            <option value="">Toda prioridade</option>
            <option>Alta</option><option>Média</option><option>Baixa</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}><Plus size={15} /> Nova Tarefa</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Tarefa</th>
                <th className="table-th hidden md:table-cell">Cliente</th>
                <th className="table-th hidden lg:table-cell">Responsável</th>
                <th className="table-th hidden md:table-cell">Vencimento</th>
                <th className="table-th">Prioridade</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Nenhuma tarefa encontrada.</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="font-medium text-gray-900 text-sm">{t.titulo}</div>
                    {t.tipo && <div className="text-xs text-gray-400">{t.tipo}</div>}
                  </td>
                  <td className="table-td hidden md:table-cell text-gray-500 text-sm">{t.cliente_nome ?? '-'}</td>
                  <td className="table-td hidden lg:table-cell text-gray-500 text-sm">{t.responsavel_nome ?? '-'}</td>
                  <td className="table-td hidden md:table-cell text-sm">
                    {t.data_vencimento ? (
                      <span className={t.status === 'Atrasado' ? 'text-[#C8232B]' : 'text-gray-500'}>
                        {formatDate(t.data_vencimento)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${prioridadeColor(t.prioridade)}`}>{t.prioridade}</span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${statusTarefaColor(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="table-td">
                    {t.status !== 'Concluído' && (
                      <button className="text-green-500 hover:text-green-700" title="Concluir" onClick={() => concluir(t.id)}>
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nova tarefa */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">{form.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Título *</label>
                <input className="input" value={form.titulo ?? ''} onChange={e => upd('titulo', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select className="select" value={form.tipo ?? ''} onChange={e => upd('tipo', e.target.value)}>
                    <option value="">Selecione</option>
                    {TIPOS_TAREFA.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prioridade</label>
                  <select className="select" value={form.prioridade ?? 'Média'} onChange={e => upd('prioridade', e.target.value)}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="label">Cliente vinculado</label>
                  <select className="select" value={form.cliente_id ?? ''} onChange={e => upd('cliente_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Responsável</label>
                  <select className="select" value={form.responsavel_id ?? ''} onChange={e => upd('responsavel_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Data de início</label>
                  <input type="date" className="input" value={form.data_inicio ?? ''} onChange={e => upd('data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Hora</label>
                  <input type="time" className="input" value={form.hora_inicio ?? ''} onChange={e => upd('hora_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input type="date" className="input" value={form.data_vencimento ?? ''} onChange={e => upd('data_vencimento', e.target.value)} />
                </div>
                <div>
                  <label className="label">Tempo estimado</label>
                  <input className="input" value={form.tempo_estimado ?? ''} onChange={e => upd('tempo_estimado', e.target.value)} placeholder="Ex: 2h 30min" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status ?? 'Não iniciado'} onChange={e => upd('status', e.target.value as StatusTarefa)}>
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={3} value={form.observacoes ?? ''} onChange={e => upd('observacoes', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_LIST: StatusTarefa[] = ['Não iniciado', 'Em andamento', 'Aguardando', 'Concluído', 'Atrasado']
