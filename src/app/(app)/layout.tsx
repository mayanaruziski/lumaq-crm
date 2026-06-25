'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Kanban, CheckSquare, CalendarDays,
  Calendar, Trophy, BarChart3, UserPlus, Bell, LogOut, Menu
} from 'lucide-react'

const NAV_SUPERVISORA = [
  { label: 'Principal', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/kanban', icon: Kanban, label: 'Fluxo de Atendimento' },
    { href: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  ]},
  { label: 'Planejamento', items: [
    { href: '/semana', icon: CalendarDays, label: 'Prep. da Semana' },
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
  ]},
  { label: 'Resultados', items: [
    { href: '/fechamentos', icon: Trophy, label: 'Fechamentos' },
    { href: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  ]},
  { label: 'Administração', items: [
    { href: '/consultores', icon: UserPlus, label: 'Consultores' },
  ]},
]

const NAV_CONSULTOR = [
  { label: 'Principal', items: [
    { href: '/clientes', icon: Users, label: 'Meus Clientes' },
    { href: '/kanban', icon: Kanban, label: 'Fluxo de Atendimento' },
    { href: '/tarefas', icon: CheckSquare, label: 'Minhas Tarefas' },
  ]},
  { label: 'Planejamento', items: [
    { href: '/semana', icon: CalendarDays, label: 'Prep. da Semana' },
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
  ]},
  { label: 'Resultados', items: [
    { href: '/fechamentos', icon: Trophy, label: 'Fechamentos' },
  ]},
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading, isSupervisora } = useProfile()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const NAV = isSupervisora ? NAV_SUPERVISORA : NAV_CONSULTOR
  const pageTitle = NAV.flatMap(g => g.items).find(i => i.href === pathname)?.label ?? 'Dashboard'

  const SidebarContent = () => (
    <>
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#C8232B] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <div className="text-white text-base font-medium">Lumaq</div>
            <div className="text-gray-500 text-[10px] tracking-widest uppercase">Ambientes Planejados</div>
          </div>
        </div>
        <div className="w-8 h-0.5 bg-[#C8232B] mt-3 rounded" />
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.label} className="mb-2">
            <div className="px-4 py-2 text-[10px] text-gray-600 uppercase tracking-widest font-medium">
              {group.label}
            </div>
            {group.items.map(item => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all border-l-[3px]',
                    active
                      ? 'text-white bg-[#C8232B]/15 border-[#C8232B]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 text-xs text-gray-500 mb-1">
          {isSupervisora ? '👑 Supervisora' : '👤 Consultor'}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </div>
    </>
  )

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">Carregando...</div></div>

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex w-56 flex-col bg-[#1a1a1a] flex-shrink-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 flex flex-col bg-[#1a1a1a]">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <span className="font-medium text-gray-900 text-base flex-1">{pageTitle}</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C8232B] flex items-center justify-center text-white text-xs font-medium cursor-pointer">
              {isSupervisora ? 'SC' : 'C'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}