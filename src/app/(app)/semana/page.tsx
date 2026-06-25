'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Tarefa, Consultor } from '@/types'
import { ChevronLeft, ChevronRight, Target } from 'lucide-react'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function SemanaPage() {
  const [semanaBase, setSemanaBase] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [metas, setMetas] = useState({ visitas: 0, fechamentos: 0, horas: 40 })
  const [consultores, setConsultores] = useState<Consultor[]>([])
  const [consultorFiltro, setConsultorFiltro] = useState<string>('')

  const semanaFim = addDays(semanaBase, 5)
  const semanaStr = format(semanaBase, "dd/MM") + ' – ' + format(semanaFim, "dd/MM/yyyy")

  useEffect(() => { loadSemana() }, [semanaBase, consultorFiltro])

  async function loadSemana() {
    const inicio = format(semanaBase, 'yyyy-MM-dd')
    const fim = format(semanaFim, 'yyyy-MM-dd')
    let query = supabase.from('tarefas').select('*, cliente:clientes(nome), responsavel:consultores(nome)')
      .gte('data_inicio', inicio).lte('data_inicio', fim)
    if (consultorFiltro) query = query.eq('responsavel_id', consultorFiltro)
    const { data } = await query
    setTarefas((data ?? []).map((t: any) => ({ ...t, cliente_nome: t.cliente?.nome, responsavel_nome: t.responsavel?.nome })))

    const { data: cData } = await supabase.from('consultores').select('*').eq('ativo', true).order('nome')
    setConsultores(cData ?? [])
  }

  function tarefasNoDia(diaIdx: number) {
    const dia = format(addDays(semanaBase, diaIdx), 'yyyy-MM-dd')
    return tarefas.filter(t => t.data_inicio === dia)
  }

  function isHoje(diaIdx: number) {
    return format(addDays(semanaBase, diaIdx), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  }

  const statusColor: Record<string, string> = {
    'Não iniciado': 'bg-gray-100 border-l-gray-400',
    'Em andamento': 'bg-blue-50 border-l-blue-500',
    'Aguardando': 'bg-amber-50 border-l-amber-400',
    'Concluído': 'bg-green-50 border-l-green-500',
    'Atrasado': 'bg-red-50 border-l-[#C8232B]',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-ghost py-1.5 px-2" onClick={() => setSemanaBase(subWeeks(semanaBase, 1))}><ChevronLeft size={16} /></button>
          <span className="text-sm text-gray-700 font-medium">{semanaStr}</span>
          <button className="btn-ghost py-1.5 px-2" onClick={() => setSemanaBase(addWeeks(semanaBase, 1))}><ChevronRight size={16} /></button>
          <button className="btn-ghost py-1.5 text-xs" onClick={() => setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoje</button>
        </div>
        <select className="select w-44" value={consultorFiltro} onChange={e => setConsultorFiltro(e.target.value)}>
          <option value="">Todos os consultores</option>
          {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Metas */}
      <div className="card mb-5">
        <div className="section-title flex items-center gap-2"><Target size={14} className="text-[#C8232B]" /> Metas da Semana</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Visitas planejadas</label>
            <input type="number" className="input" value={metas.visitas} onChange={e => setMetas(p => ({ ...p, visitas: +e.target.value }))} />
          </div>
          <div>
            <label className="label">Fechamentos meta</label>
            <input type="number" className="input" value={metas.fechamentos} onChange={e => setMetas(p => ({ ...p, fechamentos: +e.target.value }))} />
          </div>
          <div>
            <label className="label">Horas estimadas</label>
            <input type="number" className="input" value={metas.horas} onChange={e => setMetas(p => ({ ...p, horas: +e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DIAS.map((dia, idx) => {
          const tasks = tarefasNoDia(idx)
          const hoje = isHoje(idx)
          return (
            <div key={dia} className={`rounded-xl border overflow-hidden ${hoje ? 'border-[#C8232B]' : 'border-gray-200'}`}>
              <div className={`px-3 py-2 text-center text-xs font-medium ${hoje ? 'bg-[#C8232B] text-white' : 'bg-gray-900 text-gray-200'}`}>
                <div>{dia}</div>
                <div className="opacity-70 text-[10px]">{format(addDays(semanaBase, idx), 'dd/MM')}</div>
              </div>
              <div className="p-2 space-y-2 min-h-28 bg-gray-50">
                {tasks.length === 0 && <p className="text-xs text-gray-300 text-center pt-4">Livre</p>}
                {tasks.map(t => (
                  <div key={t.id} className={`border-l-3 rounded p-1.5 text-xs border-l-4 ${statusColor[t.status] ?? 'bg-gray-100 border-l-gray-400'}`}>
                    {t.hora_inicio && <div className="text-gray-500 font-medium">{t.hora_inicio.slice(0, 5)}</div>}
                    <div className="text-gray-800 leading-tight">{t.titulo}</div>
                    {t.cliente_nome && <div className="text-gray-400 truncate">{t.cliente_nome}</div>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">Tarefas são cadastradas na tela de Tarefas e aparecem aqui conforme a data de início.</p>
    </div>
  )
}
