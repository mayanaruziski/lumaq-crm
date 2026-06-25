'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Evento, Cliente, Consultor } from '@/types'
import { TIPOS_EVENTO } from '@/lib/utils'
import { Plus, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const EMPTY_EV: Partial<Evento> = { titulo: '', tipo: undefined, data_inicio: '', data_fim: '', local: '', descricao: '' }

const tipo_colors: Record<string, string> = {
  Visita: 'bg-blue-100 text-blue-700',
  Medida: 'bg-amber-100 text-amber-700',
  Apresentação: 'bg-purple-100 text-purple-700',
  Reunião: 'bg-gray-100 text-gray-700',
  'Conferência final': 'bg-green-100 text-green-700',
  Liberação: 'bg-red-100 text-[#C8232B]',
  Outro: 'bg-gray-100 text-gray-500',
}

export default function AgendaPage() {
  const [mes, setMes] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [selecionado, setSelecionado] = useState<Date | null>(new Date())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Evento>>(EMPTY_EV)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [mes])

  async function loadData() {
    const inicio = format(startOfMonth(mes), 'yyyy-MM-dd')
    const fim = format(endOfMonth(mes), 'yyyy-MM-dd')
    const [evRes, cliRes, coRes] = await Promise.all([
      supabase.from('eventos').select('*, cliente:clientes(nome), consultor:consultores(nome)').gte('data_inicio', inicio).lte('data_inicio', fim + 'T23:59:59').order('data_inicio'),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setEventos((evRes.data ?? []).map((e: any) => ({ ...e, cliente_nome: e.cliente?.nome, consultor_nome: e.consultor?.nome })))
    setClientes(cliRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
  const primeiroDia = startOfMonth(mes).getDay()
  const eventosNoDia = (dia: Date) => eventos.filter(e => isSameDay(parseISO(e.data_inicio), dia))
  const eventosSelecionados = selecionado ? eventosNoDia(selecionado) : []

  async function handleSave() {
    setSaving(true)
    if (form.id) {
      await supabase.from('eventos').update(form).eq('id', form.id)
    } else {
      await supabase.from('eventos').insert([form])
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY_EV)
    loadData()
  }

  function upd(k: keyof Evento, v: any) { setForm(p => ({ ...p, [k]: v })) }
  function openNovoComDia(dia: Date) {
    setForm({ ...EMPTY_EV, data_inicio: format(dia, "yyyy-MM-dd'T'HH:mm") })
    setModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-ghost py-1.5 px-2" onClick={() => setMes(subMonths(mes, 1))}><ChevronLeft size={16} /></button>
          <span className="font-medium capitalize text-gray-800">{format(mes, 'MMMM yyyy', { locale: ptBR })}</span>
          <button className="btn-ghost py-1.5 px-2" onClick={() => setMes(addMonths(mes, 1))}><ChevronRight size={16} /></button>
          <button className="btn-ghost py-1.5 text-xs" onClick={() => setMes(new Date())}>Hoje</button>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_EV); setModal(true) }}><Plus size={15} /> Novo Evento</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendário */}
        <div className="lg:col-span-2 card">
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={i} />)}
            {diasMes.map(dia => {
              const evs = eventosNoDia(dia)
              const sel = selecionado && isSameDay(dia, selecionado)
              const hoje = isSameDay(dia, new Date())
              return (
                <div
                  key={dia.toISOString()}
                  onClick={() => setSelecionado(dia)}
                  onDoubleClick={() => openNovoComDia(dia)}
                  className={`min-h-12 rounded-lg p-1 cursor-pointer transition-colors ${sel ? 'bg-[#f5e8e9] border border-[#C8232B]' : hoje ? 'bg-gray-100 border border-gray-300' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${hoje ? 'bg-[#C8232B] text-white' : 'text-gray-700'}`}>
                    {format(dia, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map(e => (
                      <div key={e.id} className={`text-[9px] px-1 rounded truncate ${tipo_colors[e.tipo ?? 'Outro'] ?? 'bg-gray-100 text-gray-500'}`}>
                        {e.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[9px] text-gray-400">+{evs.length - 2}</div>}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Clique para ver eventos · Duplo clique para criar novo</p>
        </div>

        {/* Painel do dia */}
        <div className="card">
          <div className="section-title flex items-center gap-2">
            <Calendar size={14} className="text-[#C8232B]" />
            {selecionado ? format(selecionado, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </div>
          {eventosSelecionados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-3">
              {eventosSelecionados.map(e => (
                <div key={e.id} className={`p-3 rounded-lg border-l-4 ${tipo_colors[e.tipo ?? 'Outro']} bg-opacity-30`} style={{ borderLeftColor: '' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{e.titulo}</div>
                      <div className="text-xs text-gray-500">{e.tipo}</div>
                      {e.cliente_nome && <div className="text-xs text-gray-400 mt-0.5">{e.cliente_nome}</div>}
                      {e.local && <div className="text-xs text-gray-400">{e.local}</div>}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {format(parseISO(e.data_inicio), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selecionado && (
            <button className="btn-outline w-full justify-center mt-4 text-xs" onClick={() => openNovoComDia(selecionado)}>
              <Plus size={13} /> Evento neste dia
            </button>
          )}
        </div>
      </div>

      {/* Modal novo evento */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Novo Evento</h2>
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
                    {TIPOS_EVENTO.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <select className="select" value={form.cliente_id ?? ''} onChange={e => upd('cliente_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Início</label>
                  <input type="datetime-local" className="input" value={form.data_inicio ?? ''} onChange={e => upd('data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="datetime-local" className="input" value={form.data_fim ?? ''} onChange={e => upd('data_fim', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Local</label>
                <input className="input" value={form.local ?? ''} onChange={e => upd('local', e.target.value)} placeholder="Endereço ou local" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input" rows={2} value={form.descricao ?? ''} onChange={e => upd('descricao', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Agendar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
