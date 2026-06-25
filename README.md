# Lumaq CRM — Sistema de Gestão Comercial

Sistema completo para gestão de clientes, projetos e rotina comercial da **Lumaq Ambientes Planejados**.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Next.js 14 (App Router) |
| Estilo | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Drag & Drop | @dnd-kit |
| Gráficos | Recharts |
| Datas | date-fns |

---

## Instalação passo a passo

### 1. Clonar e instalar dependências

```bash
git clone <seu-repositorio>
cd lumaq-crm
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. No painel do projeto, vá em **SQL Editor** e execute o conteúdo do arquivo:
   ```
   supabase/migrations/001_schema.sql
   ```
   Isso cria todas as tabelas, índices, views e dados de exemplo.

3. No painel Supabase, vá em **Project Settings → API** e copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon public key**

### 3. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Criar usuário (Supervisora Comercial)

No Supabase, vá em **Authentication → Users → Invite user** e crie o e-mail e senha da supervisora.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Deploy em produção (Vercel — recomendado)

1. Faça push do projeto para um repositório GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`.
4. Altere `NEXT_PUBLIC_SITE_URL` para a URL de produção (ex: `https://lumaq-crm.vercel.app`).
5. Deploy automático a cada push na branch `main`.

---

## Estrutura do projeto

```
lumaq-crm/
├── src/
│   ├── app/
│   │   ├── (app)/                  ← Páginas autenticadas
│   │   │   ├── layout.tsx          ← Sidebar + topbar
│   │   │   ├── dashboard/          ← Dashboard executivo
│   │   │   ├── clientes/           ← Gestão de clientes (CRUD)
│   │   │   ├── kanban/             ← Fluxo de atendimento (Drag & Drop)
│   │   │   ├── tarefas/            ← Gestão de tarefas
│   │   │   ├── semana/             ← Preparação da semana
│   │   │   ├── agenda/             ← Calendário integrado
│   │   │   ├── fechamentos/        ← Fechamentos e comissões
│   │   │   ├── relatorios/         ← Relatórios com gráficos
│   │   │   └── consultores/        ← Gerenciar consultores
│   │   ├── page.tsx                ← Tela de login
│   │   ├── layout.tsx              ← Root layout
│   │   └── globals.css             ← Estilos globais
│   ├── lib/
│   │   ├── supabase.ts             ← Clientes Supabase
│   │   └── utils.ts                ← Helpers e constantes
│   └── types/
│       └── index.ts                ← Tipos TypeScript
├── supabase/
│   └── migrations/
│       └── 001_schema.sql          ← Schema completo do banco
├── tailwind.config.ts
├── package.json
└── .env.local.example
```

---

## Funcionalidades

### Dashboard Executivo
- KPIs em tempo real (fechamentos, faturamento, medidas, negociações)
- Barra de progresso da meta mensal
- Agenda do dia
- Tarefas atrasadas com alerta
- Ranking de consultores com barras de desempenho

### Gestão de Clientes
- Cadastro completo (nome, contato, endereço, origem, consultor, status)
- Filtro por status e busca por nome/e-mail/telefone
- Edição inline com modal

### Fluxo de Atendimento (Kanban)
- 12 etapas configuradas
- Drag & Drop entre colunas com @dnd-kit
- Atualização automática no banco ao soltar o card

### Tarefas
- 11 tipos de tarefa
- Prioridade (Alta/Média/Baixa)
- Status (Não iniciado / Em andamento / Aguardando / Concluído / Atrasado)
- Botão de conclusão rápida

### Preparação da Semana
- Grade semanal (Seg → Sáb)
- Destaque do dia atual
- Metas configuráveis (visitas, fechamentos, horas)
- Filtro por consultor

### Agenda
- Calendário mensal com navegação
- Eventos com cor por tipo
- Clique para ver eventos do dia
- Duplo clique para criar evento

### Fechamentos
- Registro de vendas fechadas
- Cálculo automático de comissão
- Ranking mensal de consultores com barra de progresso

### Relatórios
- Gráfico de barras: pipeline por etapa
- Gráfico de barras: vendas por consultor
- Gráfico de pizza: origem dos leads
- Exportação (estrutura pronta, implementar com biblioteca Excel)

### Consultores
- CRUD completo
- Definição de meta mensal
- Ativar/desativar consultores

---

## Próximas integrações (estrutura preparada)

- **WhatsApp Business API** — envio de lembretes por webhook
- **Google Agenda** — sincronização via Google Calendar API
- **Gmail / Outlook** — notificações por e-mail
- **Upload de documentos** — ativar Supabase Storage para PDFs, fotos, contratos

---

## Suporte

Sistema desenvolvido sob medida para Lumaq Ambientes Planejados.
