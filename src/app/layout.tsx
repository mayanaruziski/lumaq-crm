import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumaq CRM — Gestão Comercial',
  description: 'Sistema de gestão comercial e projetos — Lumaq Ambientes Planejados',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f5f5f5] text-gray-900 antialiased">{children}</body>
    </html>
  )
}
