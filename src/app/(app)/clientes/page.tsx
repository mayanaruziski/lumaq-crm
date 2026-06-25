'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, statusClienteColor, ORIGENS_LEAD, STATUS_KANBAN } from '@/lib/utils'
import type { Cliente, Consultor } from '@/types'
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, X } from 'lucide-react'

const EMPTY: Partial<Cliente> = {
  nome: '', telefone: '', whatsapp: '', email: '', endereco: '',
  cidade: '', bairro: '', origem_lead: undefined, consultor_id: undefined,
  status: 'Lead recebido', temperatura: 'Morno', valor_estimado: undefined, observacoes: '',
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState<'novo' | 'editar' | 'ver' | null>(null)
  const [form, setForm] = useState<Partial<Cliente>>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [cliRes, consRes] = await Promise.all([
      supabase.from('clientes_com_consultor').select('*').order('created_at', { ascending: false }),
      supabase.from('consultores').select('*').eq('ativo', true).order('nome'),
    ])
    setClientes(cliRes.data ?? [])
    setConsultores(consRes.data ?? [])
    setLoading(false)
  }

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.nome.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.telefone ?? '').includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  function openNovo() { setForm(EMPTY); setModal('novo') }
  function openEditar(c: Cliente) { setForm(c); setModal('editar') }
  function openVer(c: Cliente) { setForm(c); setModal('ver') }

  async function handleSave() {
    setSaving(true)
    if (modal === 'novo') {
      await supabase.from('clientes').insert([form])
    } else {
      await supabase.from('clientes').update(form).eq('id', form.id!)
    }
    setSaving(false)
    setModal(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente? Esta ação não pode ser desfeita.')) return
    await supabase.from('clientes').delete().eq('id', id)
    loadData()
  }

  function upd(k: keyof Cliente, v: any) { setForm(prev => ({ ...prev, [k]: v })) }

  return (
    <div>
      <div className="page-header">
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8" placeholder="Buscar por nome, e-mail ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_KANBAN.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openNovo}><Plus size={15} /> Novo Cliente</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Nome</th>
                <th className="table-th hidden md:table-cell">Contato</th>
                <th className="table-th hidden lg:table-cell">Origem</th>
                <th className="table-th">Consultor</th>
                <th className="table-th">Status</th>
                <th className="table-th hidden md:table-cell">Entrada</th>
                <th className="table-th w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Carregando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Nenhum cliente encontrado.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openVer(c)}>
                  <td className="table-td font-medium">{c.nome}</td>
                  <td className="table-td hidden md:table-cell text-gray-500 text-xs">
                    {c.telefone && <div className="flex items-center gap-1"><Phone size={11} />{c.telefone}</div>}
                    {c.email && <div className="flex items-center gap-1"><Mail size={11} />{c.email}</div>}
                  </td>
                  <td className="table-td hidden lg:table-cell">
                    {c.origem_lead && <span className="badge bg-gray-100 text-gray-600">{c.origem_lead}</span>}
                  </td>
                  <td className="table-td text-gray-600">{c.consultor_nome ?? '-'}</td>
                  <td className="table-td">
                    <span className={`badge ${statusClienteColor(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="table-td hidden md:table-cell text-gray-400 text-xs">{formatDate(c.data_entrada)}</td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEditar(c)}><Pencil size={13} /></button>
                      <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal novo/editar/ver */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">
                {modal === 'novo' ? 'Novo Cliente' : modal === 'editar' ? 'Editar Cliente' : form.nome}
              </h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nome completo *</label>
                  <input className="input" value={form.nome ?? ''} onChange={e => upd('nome', e.target.value)} disabled={modal === 'ver'} />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" value={form.telefone ?? ''} onChange={e => upd('telefone', e.target.value)} disabled={modal === 'ver'} placeholder="(63) 9 9000-0000" />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" value={form.whatsapp ?? ''} onChange={e => upd('whatsapp', e.target.value)} disabled={modal === 'ver'} placeholder="(63) 9 9000-0000" />
                </div>
                <div className="col-span-2">
                  <label className="label">E-mail</label>
                  <input className="input" type="email" value={form.email ?? ''} onChange={e => upd('email', e.target.value)} disabled={modal === 'ver'} />
                </div>
                <div className="col-span-2">
                  <label className="label">Endereço</label>
                  <input className="input" value={form.endereco ?? ''} onChange={e => upd('endereco', e.target.value)} disabled={modal === 'ver'} placeholder="Rua, número" />
                </div>
                <div>
                  <label className="label">Cidade</label>
                  <input className="input" value={form.cidade ?? ''} onChange={e => upd('cidade', e.target.value)} disabled={modal === 'ver'} />
                </div>
                <div>
                  <label className="label">Bairro</label>
                  <input className="input" value={form.bairro ?? ''} onChange={e => upd('bairro', e.target.value)} disabled={modal === 'ver'} />
                </div>
                <div>
                  <label className="label">Origem do Lead</label>
                  <select className="select" value={form.origem_lead ?? ''} onChange={e => upd('origem_lead', e.target.value)} disabled={modal === 'ver'}>
                    <option value="">Selecione</option>
                    {ORIGENS_LEAD.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Consultor responsável</label>
                  <select className="select" value={form.consultor_id ?? ''} onChange={e => upd('consultor_id', e.target.value)} disabled={modal === 'ver'}>
                    <option value="">Selecione</option>
                    {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status ?? 'Lead recebido'} onChange={e => upd('status', e.target.value)} disabled={modal === 'ver'}>
                    {STATUS_KANBAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Temperatura</label>
                  <select className="select" value={form.temperatura ?? 'Morno'} onChange={e => upd('temperatura', e.target.value)} disabled={modal === 'ver'}>
                    <option>Frio</option><option>Morno</option><option>Quente</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor estimado (R$)</label>
                  <input className="input" type="number" value={form.valor_estimado ?? ''} onChange={e => upd('valor_estimado', parseFloat(e.target.value))} disabled={modal === 'ver'} placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Data de entrada</label>
                  <input className="input" type="date" value={form.data_entrada ?? ''} onChange={e => upd('data_entrada', e.target.value)} disabled={modal === 'ver'} />
                </div>
                <div className="col-span-2">
                  <label className="label">Observações</label>
                  <textarea className="input" rows={3} value={form.observacoes ?? ''} onChange={e => upd('observacoes', e.target.value)} disabled={modal === 'ver'} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button className="btn-outline" onClick={() => setModal(null)}>
                {modal === 'ver' ? 'Fechar' : 'Cancelar'}
              </button>
              {modal !== 'ver' && (
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              )}
              {modal === 'ver' && (
                <button className="btn-primary" onClick={() => setModal('editar')}><Pencil size={14} /> Editar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
