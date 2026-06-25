'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

const EMPTY_EV = { titulo: '', tipo: '', data_inicio: '', data_fim: '', local: '', descricao: '', cliente_id: '' }

const tipo_colors: Record<string, string> = {
  Visita: 'bg-blue-100 text-blue-700',
  Medida: 'bg-amber-100 text-amber-700',
  Apresentacao: 'bg-purple-100 text-purple-700',
  Reuniao: 'bg-gray-100 text-gray-700',
  'Conferencia final': 'bg-green-100 text-green-700',
  Liberacao: 'bg-red-100 text-red-700',
  Outro: 'bg-gray-100 text-gray-500',
}

export default function AgendaPage() {
  const [mes, setMes] = useState(new Date())
  const [eventos, setEventos] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<Date | null>(new Date())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_EV)
  const [clientes, setClientes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [mes])

  async function loadData() {
    const inicio = format(startOfMonth(mes), 'yyyy-MM-dd')
    const fim = format(endOfMonth(mes), 'yyyy-MM-dd')
    const [evRes, cliRes] = await Promise.all([
      supabase.from('eventos').select('*, cliente:clientes(nome)').gte('data_inicio', inicio).lte('data_inicio', fim + 'T23:59:59').order('data_inicio'),
      supabase.from('clientes').select('id, nome').order('nome'),
    ])
    setEventos((evRes.data ?? []).map((e: any) => ({ ...e, cliente_nome: e.cliente?.nome })))
    setClientes(cliRes.data ?? [])
  }

  const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
  const primeiroDia = startOfMonth(mes).getDay()
  const eventosNoDia = (dia: Date) => eventos.filter(e => isSameDay(parseISO(e.data_inicio), dia))
  const eventosSelecionados = selecionado ? eventosNoDia(selecionado) : []

  async function handleSave() {
    setSaving(true)
    await supabase.from('eventos').insert([form])
    setSaving(false)
    setModal(false)
    setForm(EMPTY_EV)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    loadData()
  }

  function upd(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }
  function openNovoComDia(dia: Date) {
    setForm({ ...EMPTY_EV, data_inicio: format(dia, "yyyy-MM-dd'T'HH:mm") })
    setModal(true)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={() => setMes(subMonths(mes, 1))} className="btn-ghost py-1.5 px-2"><ChevronLeft size={16} /></button>
          <span style={{fontWeight:'500',textTransform:'capitalize'}}>{format(mes, 'MMMM yyyy', { locale: ptBR })}</span>
          <button onClick={() => setMes(addMonths(mes, 1))} className="btn-ghost py-1.5 px-2"><ChevronRight size={16} /></button>
          <button onClick={() => setMes(new Date())} className="btn-ghost py-1.5 text-xs">Hoje</button>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_EV); setModal(true) }}><Plus size={15} /> Novo Evento</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px'}}>
        <div style={{gridColumn:'span 2'}} className="card">
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'8px'}}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map(d => (
              <div key={d} style={{textAlign:'center',fontSize:'11px',color:'#9ca3af',fontWeight:'500',padding:'8px 0'}}>{d}</div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px'}}>
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={i} />)}
            {diasMes.map(dia => {
              const evs = eventosNoDia(dia)
              const sel = selecionado && isSameDay(dia, selecionado)
              const hoje = isSameDay(dia, new Date())
              return (
                <div key={dia.toISOString()} onClick={() => setSelecionado(dia)} onDoubleClick={() => openNovoComDia(dia)}
                  style={{minHeight:'48px',borderRadius:'8px',padding:'4px',cursor:'pointer',
                    background: sel ? '#f5e8e9' : hoje ? '#f3f4f6' : 'transparent',
                    border: sel ? '1px solid #C8232B' : hoje ? '1px solid #d1d5db' : '1px solid transparent'}}>
                  <div style={{fontSize:'12px',fontWeight:'500',marginBottom:'2px',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:hoje?'#C8232B':'transparent',color:hoje?'white':'#374151'}}>
                    {format(dia, 'd')}
                  </div>
                  <div>
                    {evs.slice(0, 2).map(e => (
                      <div key={e.id} style={{fontSize:'9px',padding:'1px 4px',borderRadius:'4px',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                        className={tipo_colors[e.tipo ?? 'Outro'] ?? 'bg-gray-100 text-gray-500'}>
                        {e.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && <div style={{fontSize:'9px',color:'#9ca3af'}}>+{evs.length - 2}</div>}
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{fontSize:'11px',color:'#9ca3af',textAlign:'center',marginTop:'8px'}}>Clique para ver · Duplo clique para criar</p>
        </div>

        <div className="card">
          <div className="section-title">
            {selecionado ? format(selecionado, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </div>
          {eventosSelecionados.length === 0 ? (
            <p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'32px 0'}}>Nenhum evento neste dia.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {eventosSelecionados.map(e => (
                <div key={e.id} style={{padding:'12px',borderRadius:'8px',background:'#f9fafb',border:'1px solid #e5e7eb'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'500',fontSize:'14px',color:'#111827'}}>{e.titulo}</div>
                      <div style={{fontSize:'12px',color:'#6b7280'}}>{e.tipo}</div>
                      {e.cliente_nome && <div style={{fontSize:'12px',color:'#9ca3af'}}>{e.cliente_nome}</div>}
                      {e.local && <div style={{fontSize:'12px',color:'#9ca3af'}}>{e.local}</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'}}>
                      <div style={{fontSize:'12px',color:'#9ca3af'}}>
                        {format(parseISO(e.data_inicio), 'HH:mm')}
                      </div>
                      <button onClick={() => handleDelete(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'4px'}} title="Apagar evento">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selecionado && (
            <button className="btn-outline" style={{width:'100%',justifyContent:'center',marginTop:'16px',fontSize:'12px'}} onClick={() => openNovoComDia(selecionado)}>
              <Plus size={13} /> Evento neste dia
            </button>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>Novo Evento</h2>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20} className="text-gray-400" /></button>
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
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',padding:'20px',borderTop:'1px solid #f3f4f6'}}>
              <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Agendar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
