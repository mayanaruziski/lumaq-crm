'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react'

const EMPTY_EV = { titulo: '', tipo: '', data_inicio: '', data_fim: '', local: '', descricao: '', cliente_id: '', consultor_id: '' }

export default function AgendaPage() {
  const [mes, setMes] = useState(new Date())
  const [eventos, setEventos] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<Date | null>(new Date())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_EV)
  const [editId, setEditId] = useState<string | null>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [consultores, setConsultores] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [isSup, setIsSup] = useState(true)
  const [meuConsultorId, setMeuConsultorId] = useState<string | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)

  useEffect(() => {
    initAndLoad()
  }, [mes])

  async function initAndLoad() {
    const { data: { session } } = await supabase.auth.getSession()
    let sup = true
    let consId: string | null = null
    if (session) {
      const { data } = await supabase.from('perfis').select('role, consultor_id').eq('id', session.user.id).single()
      if (data) {
        sup = data.role === 'supervisora'
        consId = data.consultor_id
      }
    }
    setIsSup(sup)
    setMeuConsultorId(consId)
    setLoadingPerfil(false)
    await loadData(sup, consId)
  }

  async function loadData(sup: boolean, consId: string | null) {
    const inicio = format(startOfMonth(mes), 'yyyy-MM-dd')
    const fim = format(endOfMonth(mes), 'yyyy-MM-dd')
    let query = supabase.from('eventos').select('*, cliente:clientes(nome)').gte('data_inicio', inicio).lte('data_inicio', fim + 'T23:59:59').order('data_inicio')
    if (!sup && consId) {
      query = query.eq('consultor_id', consId)
    }
    const evRes = await query
    const cliRes = await supabase.from('clientes').select('id, nome').order('nome')
    const coRes = await supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome')
    setEventos((evRes.data ?? []).map((e: any) => ({ ...e, cliente_nome: e.cliente?.nome })))
    setClientes(cliRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
  const primeiroDia = startOfMonth(mes).getDay()
  const eventosNoDia = (dia: Date) => eventos.filter(e => isSameDay(parseISO(e.data_inicio), dia))
  const eventosSelecionados = selecionado ? eventosNoDia(selecionado) : []

  async function handleSave() {
    setSaving(true)
    const payload = { ...form }
    if (!isSup && meuConsultorId) payload.consultor_id = meuConsultorId
    if (editId) {
      await supabase.from('eventos').update(payload).eq('id', editId)
    } else {
      await supabase.from('eventos').insert([payload])
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY_EV)
    setEditId(null)
    loadData(isSup, meuConsultorId)
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    loadData(isSup, meuConsultorId)
  }

  function handleEdit(e: any) {
    setForm({
      titulo: e.titulo ?? '',
      tipo: e.tipo ?? '',
      data_inicio: e.data_inicio ? e.data_inicio.slice(0,16) : '',
      data_fim: e.data_fim ? e.data_fim.slice(0,16) : '',
      local: e.local ?? '',
      descricao: e.descricao ?? '',
      cliente_id: e.cliente_id ?? '',
      consultor_id: e.consultor_id ?? '',
    })
    setEditId(e.id)
    setModal(true)
  }

  function upd(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }
  function openNovoComDia(dia: Date) {
    const base = { ...EMPTY_EV, data_inicio: format(dia, "yyyy-MM-dd'T'HH:mm") }
    if (!isSup && meuConsultorId) base.consultor_id = meuConsultorId
    setForm(base)
    setEditId(null)
    setModal(true)
  }

  if (loadingPerfil) return <div style={{textAlign:'center',padding:'40px',color:'#9ca3af'}}>Carregando...</div>

  const tipo_cores: Record<string, string> = {
    Visita: '#dbeafe', Medida: '#fef3c7', Apresentacao: '#ede9fe',
    Reuniao: '#f3f4f6', 'Conferencia final': '#d1fae5', Liberacao: '#fee2e2', Outro: '#f3f4f6',
  }

  return (
    <div>
      {!isSup && (
        <div style={{background:'#fef3c7',color:'#92400e',padding:'8px 14px',borderRadius:'8px',fontSize:'12px',marginBottom:'16px'}}>
          Voce esta vendo apenas seus proprios eventos.
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={() => setMes(subMonths(mes, 1))} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 10px',cursor:'pointer'}}><ChevronLeft size={16} /></button>
          <span style={{fontWeight:'500',textTransform:'capitalize',fontSize:'15px'}}>{format(mes, 'MMMM yyyy', { locale: ptBR })}</span>
          <button onClick={() => setMes(addMonths(mes, 1))} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 10px',cursor:'pointer'}}><ChevronRight size={16} /></button>
          <button onClick={() => setMes(new Date())} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'12px'}}>Hoje</button>
        </div>
        <button className="btn-primary" onClick={() => { const base = { ...EMPTY_EV }; if (!isSup && meuConsultorId) base.consultor_id = meuConsultorId; setForm(base); setEditId(null); setModal(true) }}><Plus size={15} /> Novo Evento</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'20px'}}>
        <div className="card">
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'8px'}}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map(d => (
              <div key={d} style={{textAlign:'center',fontSize:'11px',color:'#9ca3af',fontWeight:'500',padding:'8px 0'}}>{d}</div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={i} />)}
            {diasMes.map(dia => {
              const evs = eventosNoDia(dia)
              const sel = selecionado && isSameDay(dia, selecionado)
              const hoje = isSameDay(dia, new Date())
              return (
                <div key={dia.toISOString()} onClick={() => setSelecionado(dia)} onDoubleClick={() => openNovoComDia(dia)}
                  style={{minHeight:'52px',borderRadius:'8px',padding:'4px',cursor:'pointer',
                    background: sel ? '#f5e8e9' : 'transparent',
                    border: sel ? '1px solid #C8232B' : hoje ? '1px solid #d1d5db' : '1px solid transparent'}}>
                  <div style={{fontSize:'12px',fontWeight:'500',marginBottom:'2px',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:hoje?'#C8232B':'transparent',color:hoje?'white':'#374151'}}>
                    {format(dia, 'd')}
                  </div>
                  {evs.slice(0, 2).map(e => (
                    <div key={e.id} style={{fontSize:'9px',padding:'1px 4px',borderRadius:'3px',marginBottom:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:tipo_cores[e.tipo??'Outro']??'#f3f4f6',color:'#374151'}}>
                      {e.titulo}
                    </div>
                  ))}
                  {evs.length > 2 && <div style={{fontSize:'9px',color:'#9ca3af'}}>+{evs.length - 2}</div>}
                </div>
              )
            })}
          </div>
          <p style={{fontSize:'11px',color:'#9ca3af',textAlign:'center',marginTop:'8px'}}>Clique para ver · Duplo clique para criar</p>
        </div>

        <div className="card">
          <div style={{fontWeight:'500',fontSize:'14px',color:'#111827',marginBottom:'12px'}}>
            {selecionado ? format(selecionado, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </div>
          {eventosSelecionados.length === 0 ? (
            <p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'32px 0'}}>Nenhum evento neste dia.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {eventosSelecionados.map(e => (
                <div key={e.id} style={{padding:'12px',borderRadius:'8px',background:'#f9fafb',border:'1px solid #e5e7eb'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:'500',fontSize:'14px',color:'#111827',marginBottom:'2px'}}>{e.titulo}</div>
                      {e.tipo && <div style={{fontSize:'11px',color:'#6b7280',marginBottom:'2px'}}>{e.tipo}</div>}
                      {e.cliente_nome && <div style={{fontSize:'11px',color:'#9ca3af'}}>{e.cliente_nome}</div>}
                      {e.local && <div style={{fontSize:'11px',color:'#9ca3af'}}>{e.local}</div>}
                      <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'4px'}}>{format(parseISO(e.data_inicio), 'HH:mm')}</div>
                    </div>
                    <div style={{display:'flex',gap:'4px',marginLeft:'8px'}}>
                      <button onClick={() => handleEdit(e)} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',color:'#6b7280',padding:'4px 6px'}} title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:'6px',cursor:'pointer',color:'#ef4444',padding:'4px 6px'}} title="Apagar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selecionado && (
            <button onClick={() => openNovoComDia(selecionado)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%',marginTop:'16px',padding:'8px',border:'1px solid #C8232B',borderRadius:'8px',color:'#C8232B',background:'transparent',cursor:'pointer',fontSize:'12px'}}>
              <Plus size={13} /> Evento neste dia
            </button>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>{editId ? 'Editar Evento' : 'Novo Evento'}</h2>
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
                    {['Visita','Medida','Apresentacao','Reuniao','Conferencia final','Liberacao','Outro'].map(t => <option key={t}>{t}</option>)}
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
                  <label className="label">Consultor</label>
                  <select className="select" value={form.consultor_id} onChange={e => upd('consultor_id', e.target.value)} disabled={!isSup}>
                    <option value="">Nenhum</option>
                    {consultores.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Inicio</label>
                  <input type="datetime-local" className="input" value={form.data_inicio} onChange={e => upd('data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="datetime-local" className="input" value={form.data_fim} onChange={e => upd('data_fim', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Local</label>
                <input className="input" value={form.local} onChange={e => upd('local', e.target.value)} placeholder="Endereco ou local" />
              </div>
              <div>
                <label className="label">Descricao</label>
                <textarea className="input" rows={2} value={form.descricao} onChange={e => upd('descricao', e.target.value)} />
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',padding:'20px',borderTop:'1px solid #f3f4f6'}}>
              <button className="btn-outline" onClick={() => { setModal(false); setEditId(null) }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editId ? 'Atualizar' : 'Agendar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
