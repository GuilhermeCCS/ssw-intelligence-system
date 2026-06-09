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
