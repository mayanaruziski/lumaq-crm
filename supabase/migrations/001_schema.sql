-- ============================================================
-- LUMAQ CRM — Schema completo do banco de dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: consultores
-- ============================================================
create table public.consultores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique,
  telefone text,
  meta_mensal numeric(12,2) default 0,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
create table public.clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text,
  whatsapp text,
  email text,
  endereco text,
  cidade text,
  bairro text,
  origem_lead text check (origem_lead in ('Instagram','Facebook','Google','Indicação','Showroom','WhatsApp','Outros')),
  consultor_id uuid references public.consultores(id) on delete set null,
  status text not null default 'Lead recebido' check (status in (
    'Lead recebido','Primeiro atendimento','Medida técnica',
    'Desenvolvimento de projeto','Apresentação','Negociação',
    'Fechado','Conferência final','Liberação para produção',
    'Produção','Montagem','Entregue'
  )),
  temperatura text check (temperatura in ('Frio','Morno','Quente')) default 'Morno',
  valor_estimado numeric(12,2),
  observacoes text,
  data_entrada date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: tarefas
-- ============================================================
create table public.tarefas (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  tipo text check (tipo in (
    'Medida','Desenvolvimento de projeto','Apresentação','Negociação',
    'Conferência final','Liberação para produção','Documentação',
    'Pós-venda','Financeiro','Reunião','Treinamento'
  )),
  cliente_id uuid references public.clientes(id) on delete set null,
  responsavel_id uuid references public.consultores(id) on delete set null,
  data_inicio date,
  hora_inicio time,
  tempo_estimado text,
  prioridade text check (prioridade in ('Alta','Média','Baixa')) default 'Média',
  data_vencimento date,
  data_conclusao date,
  observacoes text,
  status text not null default 'Não iniciado' check (status in (
    'Não iniciado','Em andamento','Aguardando','Concluído','Atrasado'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: eventos (agenda)
-- ============================================================
create table public.eventos (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  tipo text check (tipo in ('Visita','Medida','Apresentação','Reunião','Conferência final','Liberação','Outro')),
  cliente_id uuid references public.clientes(id) on delete set null,
  consultor_id uuid references public.consultores(id) on delete set null,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  local text,
  descricao text,
  lembrete_enviado boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: fechamentos
-- ============================================================
create table public.fechamentos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  consultor_id uuid references public.consultores(id) on delete set null,
  data_fechamento date not null default current_date,
  valor numeric(12,2) not null,
  percentual_comissao numeric(5,2) default 6.0,
  valor_comissao numeric(12,2) generated always as (valor * percentual_comissao / 100) stored,
  observacoes text,
  mes_referencia text generated always as (to_char(data_fechamento, 'YYYY-MM')) stored,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: documentos (por cliente)
-- ============================================================
create table public.documentos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo text check (tipo in ('Contrato','Projeto PDF','Renderização','Medidas','Conferência final','Comprovante','Foto','Outro')),
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: planejamento_semanal
-- ============================================================
create table public.planejamento_semanal (
  id uuid primary key default uuid_generate_v4(),
  semana_inicio date not null,
  consultor_id uuid references public.consultores(id) on delete set null,
  meta_visitas int default 0,
  meta_fechamentos int default 0,
  horas_estimadas numeric(5,1) default 40,
  observacoes text,
  created_at timestamptz default now(),
  unique(semana_inicio, consultor_id)
);

-- ============================================================
-- TABELA: metas_mensais
-- ============================================================
create table public.metas_mensais (
  id uuid primary key default uuid_generate_v4(),
  mes_referencia text not null,
  consultor_id uuid references public.consultores(id) on delete cascade,
  meta_valor numeric(12,2) not null,
  created_at timestamptz default now(),
  unique(mes_referencia, consultor_id)
);

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- Clientes com nome do consultor
create or replace view public.clientes_com_consultor as
select
  c.*,
  co.nome as consultor_nome
from public.clientes c
left join public.consultores co on co.id = c.consultor_id;

-- Resumo de fechamentos por consultor e mês
create or replace view public.resumo_fechamentos as
select
  f.mes_referencia,
  f.consultor_id,
  co.nome as consultor_nome,
  count(*) as total_fechamentos,
  sum(f.valor) as total_valor,
  sum(f.valor_comissao) as total_comissao
from public.fechamentos f
left join public.consultores co on co.id = f.consultor_id
group by f.mes_referencia, f.consultor_id, co.nome;

-- Tarefas atrasadas
create or replace view public.tarefas_atrasadas as
select t.*, c.nome as cliente_nome, co.nome as consultor_nome
from public.tarefas t
left join public.clientes c on c.id = t.cliente_id
left join public.consultores co on co.id = t.responsavel_id
where t.status != 'Concluído'
  and t.data_vencimento < current_date;

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_clientes_status on public.clientes(status);
create index idx_clientes_consultor on public.clientes(consultor_id);
create index idx_tarefas_status on public.tarefas(status);
create index idx_tarefas_vencimento on public.tarefas(data_vencimento);
create index idx_eventos_data on public.eventos(data_inicio);
create index idx_fechamentos_mes on public.fechamentos(mes_referencia);

-- ============================================================
-- ROW LEVEL SECURITY (habilitar após configurar auth)
-- ============================================================
alter table public.consultores enable row level security;
alter table public.clientes enable row level security;
alter table public.tarefas enable row level security;
alter table public.eventos enable row level security;
alter table public.fechamentos enable row level security;
alter table public.documentos enable row level security;

-- Política permissiva para usuários autenticados (ajuste conforme necessário)
create policy "Authenticated users full access" on public.consultores for all to authenticated using (true) with check (true);
create policy "Authenticated users full access" on public.clientes for all to authenticated using (true) with check (true);
create policy "Authenticated users full access" on public.tarefas for all to authenticated using (true) with check (true);
create policy "Authenticated users full access" on public.eventos for all to authenticated using (true) with check (true);
create policy "Authenticated users full access" on public.fechamentos for all to authenticated using (true) with check (true);
create policy "Authenticated users full access" on public.documentos for all to authenticated using (true) with check (true);

-- ============================================================
-- DADOS DE EXEMPLO (opcional — remova em produção)
-- ============================================================
insert into public.consultores (nome, email, meta_mensal) values
  ('Luísa Ferreira', 'luisa@lumaq.com.br', 70000),
  ('Marcos Costa', 'marcos@lumaq.com.br', 55000),
  ('Juliana Prado', 'juliana@lumaq.com.br', 45000),
  ('Roberto Alves', 'roberto@lumaq.com.br', 40000);
