'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Target, Plus, X, Pencil, Trash2 } from 'lucide-react'

const DIAS = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

const STATUS_CORES: Record<string, string> = {
  'Nao iniciado': '#f3f4f6',
  'Em andamento': '#dbeafe',
  'Aguardando': '#fef3c7',
  'Concluido': '#d1fae5',
  'Atrasado': '#fee2e2',
}

const EMPTY_TAREFA: any = {
  titulo: '', tipo: '', cliente_id: '', responsavel_id: '',
  data_inicio: '', hora_inicio: '', prioridade: 'Media',
  data_vencimento: '', observacoes: '', status: 'Nao iniciado',
}

export default function SemanaPage() {
  const [semanaBase, setSemanaBase] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [tarefas, setTarefas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [consultores, setConsultores] = useState<any[]>([])
  const [metas, setMetas] = useState({ visitas: 0, fechamentos: 0, horas: 40 })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_TAREFA)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [diaModal, setDiaModal] = useState('')

  const semanaFim = addDays(semanaBase, 5)
  const semanaStr = format(semanaBase, "dd/MM") + ' - ' + format(semanaFim, "dd/MM/yyyy")

  useEffect(() => { loadData() }, [semanaBase])

  async function loadData() {
    const inicio = format(semanaBase, 'yyyy-MM-dd')
    const fim = format(semanaFim, 'yyyy-MM-dd')
    const [tRes, cliRes, coRes] = await Promise.all([
      supabase.from('tarefas').select('*, cliente:clientes(nome), responsavel:consultores(nome)').gte('data_inicio', inicio).lte('data_inicio', fim),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setTarefas((tRes.data ?? []).map((t: any) => ({ ...t, cliente_nome: t.cliente?.nome, responsavel_nome: t.responsavel?.nome })))
    setClientes(cliRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  function tarefasNoDia(diaIdx: number) {
    const dia = format(addDays(semanaBase, diaIdx), 'yyyy-MM-dd')
    return tarefas.filter(t => t.data_inicio === dia)
  }

  function isHoje(diaIdx: number) {
    return format(addDays(semanaBase, diaIdx), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  }

  function openNovaTarefa(diaIdx: number) {
    const dia = format(addDays(semanaBase, diaIdx), 'yyyy-MM-dd')
    setForm({ ...EMPTY_TAREFA, data_inicio: dia })
    setDiaModal(dia)
    setEditId(null)
    setModal(true)
  }

  function openEditarTarefa(t: any) {
    setForm({
      titulo: t.titulo ?? '',
      tipo: t.tipo ?? '',
      cliente_id: t.cliente_id ?? '',
      responsavel_id: t.responsavel_id ?? '',
      data_inicio: t.data_inicio ?? '',
      hora_inicio: t.hora_inicio ?? '',
      prioridade: t.prioridade ?? 'Media',
      data_vencimento: t.data_vencimento ?? '',
      observacoes: t.observacoes ?? '',
      status: t.status ?? 'Nao iniciado',
    })
    setEditId(t.id)
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editId) {
      await supabase.from('tarefas').update(form).eq('id', editId)
    } else {
      const { data: novaTarefa } = await supabase.from('tarefas').insert([form]).select().single()
      if (novaTarefa && novaTarefa.data_inicio) {
        const dataHora = novaTarefa.hora_inicio ? novaTarefa.data_inicio + 'T' + novaTarefa.hora_inicio : novaTarefa.data_inicio + 'T09:00'
        await supabase.from('eventos').insert([{
          titulo: novaTarefa.titulo,
          tipo: novaTarefa.tipo || 'Outro',
          cliente_id: novaTarefa.cliente_id,
          consultor_id: novaTarefa.responsavel_id,
          data_inicio: dataHora,
          descricao: novaTarefa.observacoes || '',
        }])
      }
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY_TAREFA)
    setEditId(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar esta tarefa?')) return
    await supabase.from('tarefas').delete().eq('id', id)
    loadData()
  }

  function upd(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={() => setSemanaBase(subWeeks(semanaBase, 1))} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 10px',cursor:'pointer'}}><ChevronLeft size={16} /></button>
          <span style={{fontWeight:'500',fontSize:'14px',color:'#374151'}}>{semanaStr}</span>
          <button onClick={() => setSemanaBase(addWeeks(semanaBase, 1))} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 10px',cursor:'pointer'}}><ChevronRight size={16} /></button>
          <button onClick={() => setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 1 }))} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'12px'}}>Hoje</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',fontWeight:'500',fontSize:'14px'}}>
          <Target size={14} style={{color:'#C8232B'}} /> Metas da Semana
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
          {[
            { label: 'Visitas planejadas', key: 'visitas' },
            { label: 'Fechamentos meta', key: 'fechamentos' },
            { label: 'Horas estimadas', key: 'horas' },
          ].map(m => (
            <div key={m.key}>
              <label className="label">{m.label}</label>
              <input type="number" className="input" value={(metas as any)[m.key]}
                onChange={e => setMetas(p => ({ ...p, [m.key]: +e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px'}}>
        {DIAS.map((dia, idx) => {
          const tasks = tarefasNoDia(idx)
          const hoje = isHoje(idx)
          return (
            <div key={dia} style={{borderRadius:'10px',border: hoje ? '2px solid #C8232B' : '1px solid #e5e7eb',overflow:'hidden'}}>
              <div style={{padding:'8px',textAlign:'center',fontSize:'12px',fontWeight:'500',background: hoje ? '#C8232B' : '#1a1a1a',color:'white'}}>
                <div>{dia}</div>
                <div style={{opacity:0.7,fontSize:'10px'}}>{format(addDays(semanaBase, idx), 'dd/MM')}</div>
              </div>
              <div style={{padding:'8px',minHeight:'120px',background:'#f9fafb',display:'flex',flexDirection:'column',gap:'6px'}}>
                {tasks.length === 0 && <p style={{fontSize:'11px',color:'#d1d5db',textAlign:'center',paddingTop:'16px'}}>Livre</p>}
                {tasks.map(t => (
                  <div key={t.id} style={{borderLeft:'3px solid #C8232B',borderRadius:'4px',padding:'6px 8px',fontSize:'11px',background:STATUS_CORES[t.status]??'#f3f4f6',cursor:'pointer'}}>
                    {t.hora_inicio && <div style={{color:'#6b7280',fontWeight:'500',fontSize:'10px'}}>{t.hora_inicio.slice(0,5)}</div>}
                    <div style={{color:'#111827',fontWeight:'500',lineHeight:'1.3'}}>{t.titulo}</div>
                    {t.cliente_nome && <div style={{color:'#9ca3af',fontSize:'10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.cliente_nome}</div>}
                    <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>
                      <button onClick={() => openEditarTarefa(t)} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',padding:'2px'}} title="Editar">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'2px'}} title="Apagar">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => openNovaTarefa(idx)}
                  style={{background:'none',border:'1px dashed #d1d5db',borderRadius:'4px',padding:'4px',cursor:'pointer',color:'#9ca3af',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',marginTop:'auto'}}>
                  <Plus size={10} /> Adicionar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'520px',maxHeight:'90vh',overflowY:'auto'}}>
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
                    {['Medida','Apresentacao','Negociacao','Conferencia final','Reuniao','Treinamento','Outro'].map(t => <option key={t}>{t}</option>)}
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
                  <label className="label">Data</label>
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
                    {['Nao iniciado','Em andamento','Aguardando','Atrasado'].map(s => <option key={s}>{s}</option>)}
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

