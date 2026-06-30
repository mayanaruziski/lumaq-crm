'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Trophy, Trash2, Pencil } from 'lucide-react'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
}

const MESES = [
  { value: '2026-01', label: 'Janeiro 2026' },
  { value: '2026-02', label: 'Fevereiro 2026' },
  { value: '2026-03', label: 'Marco 2026' },
  { value: '2026-04', label: 'Abril 2026' },
  { value: '2026-05', label: 'Maio 2026' },
  { value: '2026-06', label: 'Junho 2026' },
  { value: '2026-07', label: 'Julho 2026' },
  { value: '2026-08', label: 'Agosto 2026' },
  { value: '2026-09', label: 'Setembro 2026' },
  { value: '2026-10', label: 'Outubro 2026' },
  { value: '2026-11', label: 'Novembro 2026' },
  { value: '2026-12', label: 'Dezembro 2026' },
  { value: 'todos', label: 'Todos os meses' },
]

const EMPTY = { cliente_id: '', consultor_id: '', data_fechamento: new Date().toISOString().split('T')[0], valor: '', percentual_comissao: 6, observacoes: '' }

export default function FechamentosPage() {
  const mesAtual = new Date().toISOString().slice(0, 7)
  const [mesRef, setMesRef] = useState(mesAtual)
  const [fechamentos, setFechamentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [consultores, setConsultores] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [mesRef])

  async function loadData() {
    let query = supabase.from('fechamentos').select('*, cliente:clientes(nome), consultor:consultores(nome)').order('data_fechamento', { ascending: false })
    if (mesRef !== 'todos') {
      query = query.eq('mes_referencia', mesRef)
    }
    const fRes = await query
    const cliRes = await supabase.from('clientes').select('id, nome').order('nome')
    const coRes = await supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome')
    setFechamentos((fRes.data ?? []).map((f: any) => ({ ...f, cliente_nome: f.cliente?.nome, consultor_nome: f.consultor?.nome })))
    setClientes(cliRes.data ?? [])
    setConsultores(coRes.data ?? [])
  }

  const totalValor = fechamentos.reduce((s, f) => s + (f.valor ?? 0), 0)
  const totalComissao = fechamentos.reduce((s, f) => s + (f.valor_comissao ?? 0), 0)
  const ticketMedio = fechamentos.length > 0 ? totalValor / fechamentos.length : 0

  const rankingMap: Record<string, any> = {}
  fechamentos.forEach(f => {
    if (!f.consultor_id) return
    if (!rankingMap[f.consultor_id]) rankingMap[f.consultor_id] = { nome: f.consultor_nome ?? '', valor: 0, qtd: 0 }
    rankingMap[f.consultor_id].valor += f.valor ?? 0
    rankingMap[f.consultor_id].qtd++
  })
  const ranking = Object.entries(rankingMap).sort((a, b) => b[1].valor - a[1].valor)

  async function handleDelete(id: string) {
    if (!confirm('Apagar este fechamento?')) return
    await supabase.from('fechamentos').delete().eq('id', id)
    loadData()
  }

  function handleEdit(f: any) {
    setForm({
      cliente_id: f.cliente_id ?? '',
      consultor_id: f.consultor_id ?? '',
      data_fechamento: f.data_fechamento ?? new Date().toISOString().split('T')[0],
      valor: f.valor ?? '',
      percentual_comissao: f.percentual_comissao ?? 6,
      observacoes: f.observacoes ?? '',
    })
    setEditId(f.id)
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const valorNum = form.valor !== '' && !isNaN(Number(form.valor)) ? Number(form.valor) : 0
    const percNum = form.percentual_comissao !== '' && !isNaN(Number(form.percentual_comissao)) ? Number(form.percentual_comissao) : 6
    const payload = {
      cliente_id: form.cliente_id || null,
      consultor_id: form.consultor_id || null,
      data_fechamento: form.data_fechamento,
      valor: valorNum,
      percentual_comissao: percNum,
      observacoes: form.observacoes,
      mes_referencia: form.data_fechamento ? form.data_fechamento.slice(0, 7) : mesRef,
      valor_comissao: valorNum * percNum / 100,
    }
    if (editId) {
      await supabase.from('fechamentos').update(payload).eq('id', editId)
    } else {
      await supabase.from('fechamentos').insert([payload])
      if (form.cliente_id) await supabase.from('clientes').update({ status: 'Fechado' }).eq('id', form.cliente_id)
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    setEditId(null)
    loadData()
  }

  function upd(k: string, v: any) {
    setForm((p: any) => ({ ...p, [k]: v }))
  }

  const mesLabel = MESES.find(m => m.value === mesRef)?.label ?? mesRef

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
          <label style={{fontSize:'12px',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px'}}>Periodo</label>
          <select className="select" style={{width:'180px'}} value={mesRef} onChange={e => setMesRef(e.target.value)}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true) }}><Plus size={15} /> Registrar Fechamento</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
        <div style={{background:'#C8232B',borderRadius:'12px',padding:'16px'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Fechamentos</div>
          <div style={{fontSize:'28px',fontWeight:'500',color:'white',marginTop:'4px'}}>{fechamentos.length}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>{mesLabel}</div>
        </div>
        <div className="card" style={{padding:'16px'}}>
          <div style={{fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px'}}>Valor Total</div>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#111827',marginTop:'4px'}}>{formatCurrency(totalValor)}</div>
        </div>
        <div className="card" style={{padding:'16px'}}>
          <div style={{fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px'}}>Ticket Medio</div>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#111827',marginTop:'4px'}}>{formatCurrency(ticketMedio)}</div>
        </div>
        <div className="card" style={{padding:'16px'}}>
          <div style={{fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px'}}>Comissao Total</div>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#111827',marginTop:'4px'}}>{formatCurrency(totalComissao)}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{background:'#f9fafb'}}>
                <tr>
                  {['Cliente','Consultor','Data','Valor','Comissao',''].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fechamentos.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:'13px'}}>Nenhum fechamento neste periodo.</td></tr>
                )}
                {fechamentos.map(f => (
                  <tr key={f.id} style={{borderBottom:'1px solid #f9fafb'}}>
                    <td style={{padding:'12px 16px',fontWeight:'500',fontSize:'13px',color:'#111827'}}>{f.cliente_nome ?? '-'}</td>
                    <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{f.consultor_nome ?? '-'}</td>
                    <td style={{padding:'12px 16px',fontSize:'12px',color:'#9ca3af'}}>{f.data_fechamento}</td>
                    <td style={{padding:'12px 16px',fontWeight:'500',fontSize:'13px',color:'#C8232B'}}>{formatCurrency(f.valor)}</td>
                    <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{formatCurrency(f.valor_comissao ?? 0)}</td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button onClick={() => handleEdit(f)} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',color:'#6b7280',padding:'4px 6px'}} title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(f.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:'6px',cursor:'pointer',color:'#ef4444',padding:'4px 6px'}} title="Apagar">
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

        <div className="card">
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',fontWeight:'500',fontSize:'14px'}}>
            <Trophy size={14} style={{color:'#C8232B'}} /> Ranking de Consultores
          </div>
          {ranking.length === 0 ? (
            <p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'24px 0'}}>Sem dados.</p>
          ) : (
            ranking.map(([id, r], i) => (
              <div key={id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f9fafb'}}>
                <span style={{fontSize:'16px',fontWeight:'500',width:'20px',textAlign:'center',color: i === 0 ? '#C8232B' : '#d1d5db'}}>{i + 1}</span>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'11px',fontWeight:'500',flexShrink:0,background: i === 0 ? '#C8232B' : i === 1 ? '#3a3a3a' : '#888'}}>
                  {getInitials(r.nome)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.nome}</div>
                  <div style={{fontSize:'11px',color:'#9ca3af'}}>{r.qtd} fechamento{r.qtd !== 1 ? 's' : ''}</div>
                </div>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#C8232B',flexShrink:0}}>{formatCurrency(r.valor)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'460px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>{editId ? 'Editar Fechamento' : 'Registrar Fechamento'}</h2>
              <button onClick={() => { setModal(false); setEditId(null) }} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><X size={20} /></button>
            </div>
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label className="label">Cliente</label>
                <select className="select" value={form.cliente_id} onChange={e => upd('cliente_id', e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Consultor</label>
                <select className="select" value={form.consultor_id} onChange={e => upd('consultor_id', e.target.value)}>
                  <option value="">Selecione o consultor</option>
                  {consultores.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label className="label">Data do fechamento</label>
                  <input type="date" className="input" value={form.data_fechamento} onChange={e => upd('data_fechamento', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor (R\$)</label>
                  <input type="number" className="input" value={form.valor} onChange={e => upd('valor', e.target.value)} min={0} />
                </div>
                <div>
                  <label className="label">% Comissao</label>
                  <input type="number" className="input" value={form.percentual_comissao} onChange={e => upd('percentual_comissao', e.target.value)} step={0.1} min={0} max={100} />
                </div>
                <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
                  <div style={{fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px'}}>Comissao calculada</div>
                  <div style={{fontSize:'18px',fontWeight:'500',color:'#C8232B'}}>
                    {formatCurrency((Number(form.valor) || 0) * (Number(form.percentual_comissao) || 6) / 100)}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Observacoes</label>
                <textarea className="input" rows={2} value={form.observacoes} onChange={e => upd('observacoes', e.target.value)} />
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',padding:'20px',borderTop:'1px solid #f3f4f6'}}>
              <button className="btn-outline" onClick={() => { setModal(false); setEditId(null) }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.cliente_id || !form.valor}>
                {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
