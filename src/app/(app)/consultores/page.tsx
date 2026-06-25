'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { Consultor } from '@/types'
import { Plus, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'

const EMPTY: Partial<Consultor> = { nome: '', email: '', telefone: '', meta_mensal: 0, ativo: true }

export default function ConsultoresPage() {
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Consultor>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [modoEditar, setModoEditar] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase.from('consultores').select('*').order('nome')
    setConsultores(data ?? [])
  }

  function openNovo() { setForm(EMPTY); setModoEditar(false); setModal(true) }
  function openEditar(c: Consultor) { setForm(c); setModoEditar(true); setModal(true) }

  async function handleSave() {
    setSaving(true)
    if (modoEditar && form.id) {
      await supabase.from('consultores').update(form).eq('id', form.id)
    } else {
      await supabase.from('consultores').insert([form])
    }
    setSaving(false)
    setModal(false)
    loadData()
  }

  async function toggleAtivo(c: Consultor) {
    await supabase.from('consultores').update({ ativo: !c.ativo }).eq('id', c.id)
    loadData()
  }

  function upd(k: keyof Consultor, v: any) { setForm(p => ({ ...p, [k]: v })) }

  const ativos = consultores.filter(c => c.ativo)
  const inativos = consultores.filter(c => !c.ativo)

  const avatarColor = (i: number) => ['#C8232B', '#3a3a3a', '#6b6b6b', '#888', '#aaa'][i % 5]

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="text-sm text-gray-500">{ativos.length} consultores ativos</p>
        </div>
        <button className="btn-primary" onClick={openNovo}><Plus size={15} /> Adicionar Consultor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {ativos.map((c, i) => (
          <div key={c.id} className="card hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-medium flex-shrink-0"
                style={{ background: avatarColor(i) }}>
                {getInitials(c.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{c.nome}</div>
                {c.email && <div className="text-xs text-gray-400 truncate">{c.email}</div>}
                {c.telefone && <div className="text-xs text-gray-400">{c.telefone}</div>}
                <div className="mt-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Meta mensal</div>
                  <div className="text-base font-medium text-[#C8232B]">{formatCurrency(c.meta_mensal)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button className="btn-ghost p-1.5" onClick={() => openEditar(c)}><Pencil size={13} /></button>
                <button className="btn-ghost p-1.5 text-green-500" onClick={() => toggleAtivo(c)} title="Desativar">
                  <ToggleRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inativos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Inativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inativos.map(c => (
              <div key={c.id} className="card opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-medium">{getInitials(c.nome)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-600 line-through">{c.nome}</div>
                    <span className="badge bg-gray-100 text-gray-400 text-xs">Inativo</span>
                  </div>
                  <button className="btn-ghost p-1.5 text-gray-400" onClick={() => toggleAtivo(c)} title="Reativar">
                    <ToggleLeft size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">{modoEditar ? 'Editar Consultor' : 'Novo Consultor'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={form.nome ?? ''} onChange={e => upd('nome', e.target.value)} placeholder="Nome do consultor" />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" value={form.email ?? ''} onChange={e => upd('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.telefone ?? ''} onChange={e => upd('telefone', e.target.value)} placeholder="(63) 9 9000-0000" />
              </div>
              <div>
                <label className="label">Meta mensal (R$)</label>
                <input type="number" className="input" value={form.meta_mensal ?? 0} onChange={e => upd('meta_mensal', parseFloat(e.target.value))} min={0} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.nome}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
