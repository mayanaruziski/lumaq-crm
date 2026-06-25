'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase'
import { STATUS_KANBAN, getInitials } from '@/lib/utils'
import type { Cliente, StatusCliente } from '@/types'
import { Plus, Flame, Thermometer, Snowflake } from 'lucide-react'

function KanbanCard({ cliente, isDragging = false }: { cliente: Cliente; isDragging?: boolean }) {
  const tempIcon = cliente.temperatura === 'Quente' ? <Flame size={12} className="text-red-500" />
    : cliente.temperatura === 'Morno' ? <Thermometer size={12} className="text-amber-500" />
    : <Snowflake size={12} className="text-blue-400" />

  return (
    <div className={`bg-white rounded-lg border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-[#C8232B] transition-all ${isDragging ? 'shadow-lg opacity-80' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="w-7 h-7 rounded-full bg-[#C8232B] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
          {getInitials(cliente.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{cliente.nome}</div>
          <div className="text-xs text-gray-400 truncate">{cliente.consultor_nome ?? 'Sem consultor'}</div>
        </div>
        {tempIcon}
      </div>
      {cliente.origem_lead && (
        <div className="mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{cliente.origem_lead}</span>
        </div>
      )}
    </div>
  )
}

function SortableCard({ cliente }: { cliente: Cliente }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cliente.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <KanbanCard cliente={cliente} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({ status, clientes, onAddNew }: { status: StatusCliente; clientes: Cliente[]; onAddNew: (s: StatusCliente) => void }) {
  return (
    <div className="flex-shrink-0 w-48">
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div>
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">{status}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">{clientes.length}</span>
          <button onClick={() => onAddNew(status)} className="text-gray-400 hover:text-[#C8232B] transition-colors"><Plus size={14} /></button>
        </div>
      </div>
      <SortableContext items={clientes.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="bg-gray-50 rounded-xl p-2 space-y-2 min-h-20">
          {clientes.map(c => <SortableCard key={c.id} cliente={c} />)}
          {clientes.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-300">Vazio</div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [activeCliente, setActiveCliente] = useState<Cliente | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { loadClientes() }, [])

  async function loadClientes() {
    const { data } = await supabase.from('clientes_com_consultor').select('*').order('created_at', { ascending: false })
    setClientes(data ?? [])
  }

  function getByStatus(status: StatusCliente) {
    return clientes.filter(c => c.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    const c = clientes.find(c => c.id === event.active.id)
    setActiveCliente(c ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCliente(null)
    if (!over || active.id === over.id) return

    // Determinar novo status: over pode ser um card (mesmo status) ou uma coluna
    const overCliente = clientes.find(c => c.id === over.id)
    let novoStatus: StatusCliente | undefined = overCliente?.status

    if (!novoStatus) return

    // Atualizar localmente
    setClientes(prev => prev.map(c => c.id === active.id ? { ...c, status: novoStatus! } : c))

    // Persistir
    await supabase.from('clientes').update({ status: novoStatus, updated_at: new Date().toISOString() }).eq('id', active.id)
  }

  function handleAddNew(status: StatusCliente) {
    // Redireciona para /clientes com status pré-selecionado — implementação simples
    alert(`Para adicionar novo cliente em "${status}", use a tela de Clientes.`)
  }

  return (
    <div>
      <div className="page-header">
        <p className="text-xs text-gray-400">Arraste os cards para mover entre etapas</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_KANBAN.map(status => (
            <KanbanColumn key={status} status={status} clientes={getByStatus(status)} onAddNew={handleAddNew} />
          ))}
        </div>
        <DragOverlay>
          {activeCliente && <KanbanCard cliente={activeCliente} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
