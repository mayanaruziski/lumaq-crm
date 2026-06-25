'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, CheckCircle2, Trash2, Pencil } from 'lucide-react'

const EMPTY: any = {
  titulo: '', tipo: '', cliente_id: '', responsavel_id: '',
  data_inicio: '', hora_inicio: '', tempo_estimado: '', prioridade: 'Media',
  data_vencimento: '', observacoes: '', status: 'Nao iniciado',
}

const STATUS_LIST = ['Nao iniciado', 'Em andamento', 'Aguardando', 'Concluido', 'Atrasado']
const TIPOS = ['Medida','Apresentacao','Negociacao','Conferencia final','Liberacao para producao','Documentacao','Reuniao','Treinamento']

function badgeColor(status: string) {
  if (status === 'Atrasado') return {background:'#fee2e2',color:'#C8232B'}
  if (status === 'Concluido') return {background:'#d1fae5',color:'#065f46'}
  if (status === 'Em andamento') return {background:'#dbeafe',color:'#1d4ed8'}
  if (status === 'Aguardando') return {background:'#fef3c7',color:'#92400e'}
  return {background:'#f3f4f6',color:'#374151'}
}

function prioColor(p: string) {
  if (p === 'Alta') return {background:'#fee2e2',color:'#C8232B'}
  if (p === 'Media') return {background:'#fef3c7',color:'#92400e'}
  return {background:'#f3f4f6',color:'#374151'}
}

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [consultores, setConsultores] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [tRes, cRes, coRes] = await Promise.all([
      supabase.from('tarefas').select('*, cliente:clientes(nome), responsavel:consultores(nome)').order('data_vencimento', { ascending: true }),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    const raw = (tRes.data ?? []).map((t: any) => ({
      ...t, cliente_nome: t.cliente?.nome, responsavel_nome: t.responsavel?.nome,
    }))
    setTarefas(raw)
    setClientes(cRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const filtered = tarefas.filter(t => !filterStatus || t.status === filterStatus)

  async function handleSave() {
    setSaving(true)
    if (editId) {
      await supabase.from('tarefas').update(form).eq('id', editId)
    } else {
      await supabase.from('tarefas').insert([form])
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    setEditId(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar esta tarefa?')) return
    await supabase.from('tarefas').delete().eq('id', id)
    loadData()
  }

  async function concluir(id: string) {
    await supabase.from('tarefas').update({ status: 'Concluido', data_conclusao: new Date().toISOString().split('T')[0] }).eq('id', id)
    loadData()
  }

  function handleEdit(t: any) {
    setForm({
      titulo: t.titulo ?? '',
      tipo: t.tipo ?? '',
      cliente_id: t.cliente_id ?? '',
      responsavel_id: t.responsavel_id ?? '',
      data_inicio: t.data_inicio ?? '',
      hora_inicio: t.hora_inicio ?? '',
      tempo_estimado: t.tempo_estimado ?? '',
      prioridade: t.prioridade ?? 'Media',
      data_vencimento: t.data_vencimento ?? '',
      observacoes: t.observacoes ?? '',
      status: t.status ?? 'Nao iniciado',
    })
    setEditId(t.id)
    setModal(true)
  }

  function upd(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }

  const counts = {
    total: tarefas.length,
    atrasadas: tarefas.filter(t => t.status === 'Atrasado').length,
    hoje: tarefas.filter(t => t.data_vencimento === new Date().toISOString().split('T')[0]).length,
    concluidas: tarefas.filter(t => t.status === 'Concluido').length,
  }

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
        {[
          { label: 'Total', value: counts.total, color: '#111827' },
          { label: 'Vencem Hoje', value: counts.hoje, color: counts.hoje > 0 ? '#C8232B' : '#111827' },
          { label: 'Atrasadas', value: counts.atrasadas, color: counts.atrasadas > 0 ? '#C8232B' : '#111827' },
          { label: 'Concluidas', value: counts.concluidas, color: '#065f46' },
        ].map((k, i) => (
          <div key={i} className="card" style={{padding:'12px'}}>
            <div style={{fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px'}}>{k.label}</div>
            <div style={{fontSize:'24px',fontWeight:'500',marginTop:'4px',color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <select className="select" style={{width:'180px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true) }}><Plus size={15} /> Nova Tarefa</button>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{background:'#f9fafb'}}>
              <tr>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Tarefa</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Cliente</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Responsavel</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Vencimento</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Prioridade</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>Status</th>
                <th style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6',width:'100px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:'13px'}}>Nenhuma tarefa encontrada.</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} style={{borderBottom:'1px solid #f9fafb'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{fontWeight:'500',fontSize:'13px',color:'#111827'}}>{t.titulo}</div>
                    {t.tipo && <div style={{fontSize:'11px',color:'#9ca3af'}}>{t.tipo}</div>}
                  </td>
                  <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{t.cliente_nome ?? '-'}</td>
                  <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{t.responsavel_nome ?? '-'}</td>
                  <td style={{padding:'12px 16px',fontSize:'13px',color: t.status === 'Atrasado' ? '#C8232B' : '#6b7280'}}>{t.data_vencimento ?? '-'}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500',...prioColor(t.prioridade)}}>{t.prioridade}</span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500',...badgeColor(t.status)}}>{t.status}</span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:'4px'}}>
                      {t.status !== 'Concluido' && (
                        <button onClick={() => concluir(t.id)} style={{background:'none',border:'1px solid #d1fae5',borderRadius:'6px',cursor:'pointer',color:'#065f46',padding:'4px 6px'}} title="Concluir">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(t)} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',color:'#6b7280',padding:'4px 6px'}} title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:'6px',cursor:'pointer',color:'#ef4444',padding:'4px 6px'}} title="Apagar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'540px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => { setModal(false); setEditId(null) }} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><X size={20} /></button>
            </div>
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label className="label">Titulo</label>
                <input className="input" value={form.titulo} onChange={e => upd('titulo', e.target.value)} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label className="label">Tipo</label>
                  <select className="select" value={form.tipo} onChange={e => upd('tipo', e.target.value)}>
                    <option value="">Selecione</option>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prioridade</label>
                  <select className="select" value={form.prioridade} onChange={e => upd('prioridade', e.target.value)}>
                    <option>Alta</option><option>Media</option><option>Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <select className="select" value={form.cliente_id} onChange={e => upd('cliente_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Responsavel</label>
                  <select className="select" value={form.responsavel_id} onChange={e => upd('responsavel_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {consultores.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Data inicio</label>
                  <input type="date" className="input" value={form.data_inicio} onChange={e => upd('data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Hora</label>
                  <input type="time" className="input" value={form.hora_inicio} onChange={e => upd('hora_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input type="date" className="input" value={form.data_vencimento} onChange={e => upd('data_vencimento', e.target.value)} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => upd('status', e.target.value)}>
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Observacoes</label>
                <textarea className="input" rows={2} value={form.observacoes} onChange={e => upd('observacoes', e.target.value)} />
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',padding:'20px',borderTop:'1px solid #f3f4f6'}}>
              <button className="btn-outline" onClick={() => { setModal(false); setEditId(null) }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
