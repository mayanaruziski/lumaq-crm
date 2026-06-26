'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Pencil, Trash2, X, Phone, Mail, MapPin } from 'lucide-react'

const STATUS_LIST = ['Lead recebido','Primeiro atendimento','Medida tecnica','Desenvolvimento de projeto','Apresentacao','Negociacao','Fechado','Conferencia final','Liberacao para producao','Producao','Montagem','Entregue']
const ORIGENS = ['Instagram','Facebook','Google','Indicacao','Showroom','WhatsApp','Outros']

const EMPTY: any = {
  nome: '', telefone: '', whatsapp: '', email: '', endereco: '',
  cidade: '', bairro: '', origem_lead: '', consultor_id: '',
  status: 'Lead recebido', temperatura: 'Morno', valor_estimado: '', observacoes: '',
}

function statusColor(status: string) {
  if (status === 'Fechado' || status === 'Entregue') return { background: '#d1fae5', color: '#065f46' }
  if (status === 'Negociacao' || status === 'Apresentacao') return { background: '#fef3c7', color: '#92400e' }
  if (status === 'Lead recebido') return { background: '#f3f4f6', color: '#374151' }
  return { background: '#dbeafe', color: '#1d4ed8' }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [consultores, setConsultores] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [verModal, setVerModal] = useState(false)
  const [clienteVer, setClienteVer] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [cliRes, coRes] = await Promise.all([
      supabase.from('clientes').select('*, consultor:consultores(nome)').order('created_at', { ascending: false }),
      supabase.from('consultores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setClientes((cliRes.data ?? []).map((c: any) => ({ ...c, consultor_nome: c.consultor?.nome })))
    setConsultores(coRes.data ?? [])
  }

  const filtered = clientes.filter(c => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone && c.telefone.includes(busca))
    const matchStatus = !filtroStatus || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  function handleEdit(c: any) {
    setForm({
      nome: c.nome ?? '',
      telefone: c.telefone ?? '',
      whatsapp: c.whatsapp ?? '',
      email: c.email ?? '',
      endereco: c.endereco ?? '',
      cidade: c.cidade ?? '',
      bairro: c.bairro ?? '',
      origem_lead: c.origem_lead ?? '',
      consultor_id: c.consultor_id ?? '',
      status: c.status ?? 'Lead recebido',
      temperatura: c.temperatura ?? 'Morno',
      valor_estimado: c.valor_estimado ?? '',
      observacoes: c.observacoes ?? '',
    })
    setEditId(c.id)
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, consultor_id: form.consultor_id || null, valor_estimado: form.valor_estimado || null }
    if (editId) {
      await supabase.from('clientes').update(payload).eq('id', editId)
    } else {
      await supabase.from('clientes').insert([payload])
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    setEditId(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    loadData()
  }

  function upd(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <div style={{position:'relative'}}>
            <Search size={14} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}} />
            <input className="input" style={{paddingLeft:'32px',width:'220px'}} placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <select className="select" style={{width:'180px'}} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true) }}><Plus size={15} /> Novo Cliente</button>
      </div>

      <div style={{fontSize:'12px',color:'#9ca3af',marginBottom:'12px'}}>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{background:'#f9fafb'}}>
              <tr>
                {['Cliente','Contato','Consultor','Status','Temperatura',''].map(h => (
                  <th key={h} style={{textAlign:'left',padding:'10px 16px',fontSize:'11px',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f3f4f6'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:'13px'}}>Nenhum cliente encontrado.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} style={{borderBottom:'1px solid #f9fafb',cursor:'pointer'}} onClick={() => { setClienteVer(c); setVerModal(true) }}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{fontWeight:'500',fontSize:'13px',color:'#111827'}}>{c.nome}</div>
                    {c.origem_lead && <div style={{fontSize:'11px',color:'#9ca3af'}}>{c.origem_lead}</div>}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    {c.telefone && <div style={{fontSize:'12px',color:'#6b7280',display:'flex',alignItems:'center',gap:'4px'}}><Phone size={11} />{c.telefone}</div>}
                    {c.email && <div style={{fontSize:'12px',color:'#6b7280',display:'flex',alignItems:'center',gap:'4px'}}><Mail size={11} />{c.email}</div>}
                  </td>
                  <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{c.consultor_nome ?? '-'}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500',...statusColor(c.status)}}>{c.status}</span>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:'13px',color:'#6b7280'}}>{c.temperatura ?? '-'}</td>
                  <td style={{padding:'12px 16px'}} onClick={e => e.stopPropagation()}>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button onClick={() => handleEdit(c)} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',color:'#6b7280',padding:'4px 6px'}} title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:'6px',cursor:'pointer',color:'#ef4444',padding:'4px 6px'}} title="Apagar">
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

      {verModal && clienteVer && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}} onClick={() => setVerModal(false)}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>{clienteVer.nome}</h2>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={() => { setVerModal(false); handleEdit(clienteVer) }} style={{background:'none',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',color:'#6b7280',padding:'6px 10px',fontSize:'12px',display:'flex',alignItems:'center',gap:'4px'}}>
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => setVerModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><X size={20} /></button>
              </div>
            </div>
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>STATUS</div><span style={{fontSize:'12px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500',...statusColor(clienteVer.status)}}>{clienteVer.status}</span></div>
                <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>CONSULTOR</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.consultor_nome ?? '-'}</div></div>
                {clienteVer.telefone && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>TELEFONE</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.telefone}</div></div>}
                {clienteVer.whatsapp && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>WHATSAPP</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.whatsapp}</div></div>}
                {clienteVer.email && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>EMAIL</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.email}</div></div>}
                {clienteVer.cidade && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>CIDADE</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.cidade}</div></div>}
                {clienteVer.origem_lead && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>ORIGEM</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.origem_lead}</div></div>}
                {clienteVer.temperatura && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>TEMPERATURA</div><div style={{fontSize:'13px',color:'#111827'}}>{clienteVer.temperatura}</div></div>}
              </div>
              {clienteVer.observacoes && <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'4px'}}>OBSERVACOES</div><div style={{fontSize:'13px',color:'#374151',background:'#f9fafb',padding:'8px',borderRadius:'6px'}}>{clienteVer.observacoes}</div></div>}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',borderRadius:'16px',width:'100%',maxWidth:'560px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px',borderBottom:'1px solid #f3f4f6'}}>
              <h2 style={{fontWeight:'500',fontSize:'16px'}}>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => { setModal(false); setEditId(null) }} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><X size={20} /></button>
            </div>
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label className="label">Nome completo</label>
                <input className="input" value={form.nome} onChange={e => upd('nome', e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" value={form.telefone} onChange={e => upd('telefone', e.target.value)} />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" value={form.whatsapp} onChange={e => upd('whatsapp', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => upd('email', e.target.value)} />
                </div>
                <div>
                  <label className="label">Origem do lead</label>
                  <select className="select" value={form.origem_lead} onChange={e => upd('origem_lead', e.target.value)}>
                    <option value="">Selecione</option>
                    {ORIGENS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Consultor responsavel</label>
                  <select className="select" value={form.consultor_id} onChange={e => upd('consultor_id', e.target.value)}>
                    <option value="">Selecione</option>
                    {consultores.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => upd('status', e.target.value)}>
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Temperatura</label>
                  <select className="select" value={form.temperatura} onChange={e => upd('temperatura', e.target.value)}>
                    <option>Quente</option><option>Morno</option><option>Frio</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor estimado (R$)</label>
                  <input className="input" type="number" value={form.valor_estimado} onChange={e => upd('valor_estimado', e.target.value)} min={0} />
                </div>
                <div>
                  <label className="label">Cidade</label>
                  <input className="input" value={form.cidade} onChange={e => upd('cidade', e.target.value)} />
                </div>
                <div>
                  <label className="label">Bairro</label>
                  <input className="input" value={form.bairro} onChange={e => upd('bairro', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Endereco</label>
                <input className="input" value={form.endereco} onChange={e => upd('endereco', e.target.value)} />
              </div>
              <div>
                <label className="label">Observacoes</label>
                <textarea className="input" rows={3} value={form.observacoes} onChange={e => upd('observacoes', e.target.value)} />
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',padding:'20px',borderTop:'1px solid #f3f4f6'}}>
              <button className="btn-outline" onClick={() => { setModal(false); setEditId(null) }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.nome}>
                {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
