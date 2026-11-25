-- FinTrack: script ÚNICO de configuração do banco (schema.sql + open-finance.sql).
-- Cole no SQL Editor do Supabase e clique em Run. Pode ser executado mais de uma vez:
-- tudo usa "if not exists"/"drop ... if exists", então rodar de novo não quebra nada.
-- Os arquivos schema.sql e open-finance.sql continuam no projeto, como no guia.

-- 1) Tabelas ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null,
  color text not null
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  type text not null check (type in ('income', 'expense')),
  description text not null check (char_length(description) between 2 and 80),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- 2) Segurança: Row Level Security --------------------------------------
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Categorias: leitura para usuários logados" on public.categories;
create policy "Categorias: leitura para usuários logados"
  on public.categories for select to authenticated
  using (true);

drop policy if exists "Transações: ler as próprias" on public.transactions;
create policy "Transações: ler as próprias"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Transações: criar as próprias" on public.transactions;
create policy "Transações: criar as próprias"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Transações: editar as próprias" on public.transactions;
create policy "Transações: editar as próprias"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Transações: excluir as próprias" on public.transactions;
create policy "Transações: excluir as próprias"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3) Permissões de acesso pela API ----------------------------------------
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

-- 4) Categorias iniciais (só insere se a tabela estiver vazia) -------------
insert into public.categories (name, type, icon, color)
select * from (values
  ('Alimentação', 'expense', 'restaurant', '#F97316'),
  ('Transporte', 'expense', 'bus', '#3B82F6'),
  ('Moradia', 'expense', 'home', '#8B5CF6'),
  ('Saúde', 'expense', 'medkit', '#EF4444'),
  ('Lazer', 'expense', 'game-controller', '#EC4899'),
  ('Educação', 'expense', 'school', '#0EA5E9'),
  ('Compras', 'expense', 'cart', '#F59E0B'),
  ('Contas', 'expense', 'receipt', '#64748B'),
  ('Outros', 'expense', 'ellipsis-horizontal', '#94A3B8'),
  ('Salário', 'income', 'cash', '#16A34A'),
  ('Freelance', 'income', 'briefcase', '#0D9488'),
  ('Investimentos', 'income', 'trending-up', '#65A30D'),
  ('Presentes', 'income', 'gift', '#DB2777'),
  ('Outros', 'income', 'ellipsis-horizontal', '#94A3B8')
) as v(name, type, icon, color)
where not exists (select 1 from public.categories);

-- 5) Open Finance: conexões bancárias -------------------------------------
create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  pluggy_item_id text not null,
  institution_name text not null,
  institution_image_url text,
  status text not null default 'connected'
    check (status in ('connected', 'error')),
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, pluggy_item_id)
);

alter table public.bank_connections enable row level security;

drop policy if exists "Conexões: ler as próprias" on public.bank_connections;
create policy "Conexões: ler as próprias"
  on public.bank_connections for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Conexões: criar as próprias" on public.bank_connections;
create policy "Conexões: criar as próprias"
  on public.bank_connections for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Conexões: editar as próprias" on public.bank_connections;
create policy "Conexões: editar as próprias"
  on public.bank_connections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Conexões: excluir as próprias" on public.bank_connections;
create policy "Conexões: excluir as próprias"
  on public.bank_connections for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.bank_connections to authenticated;

-- 6) Open Finance: colunas novas em transactions --------------------------
alter table public.transactions
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'open_finance')),
  add column if not exists connection_id uuid
    references public.bank_connections (id) on delete cascade,
  add column if not exists external_id text,
  add column if not exists account_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_user_external_key'
  ) then
    alter table public.transactions
      add constraint transactions_user_external_key unique (user_id, external_id);
  end if;
end $$;

create index if not exists transactions_connection_idx
  on public.transactions (connection_id);

-- Conferência: deve mostrar 14 categorias.
select count(*) as categorias from public.categories;
