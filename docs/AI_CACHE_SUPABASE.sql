create table if not exists public.ai_response_cache (
  cache_key text primary key,
  purpose text not null default 'geral',
  provider text not null default 'unknown',
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_response_cache_expires_at_idx
  on public.ai_response_cache (expires_at);

create index if not exists ai_response_cache_purpose_idx
  on public.ai_response_cache (purpose);

-- Recomendado quando o backend usa SERVICE_ROLE_KEY:
alter table public.ai_response_cache enable row level security;

-- O service role do Supabase ignora RLS. Nao crie policy publica para esta tabela.
-- No Render, configure SUPABASE_SERVICE_ROLE_KEY com a chave service_role do Supabase.
-- Se usar SUPABASE_KEY com anon key, o insert falhara com:
-- new row violates row-level security policy for table "ai_response_cache"
