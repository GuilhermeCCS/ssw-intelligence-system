-- Execute uma vez no SQL Editor do Supabase, antes de publicar a API.
-- O ranking passa a usar o dominio completo como identidade e guarda a nota anterior.

begin;

alter table public.ranking
    add column if not exists site_domain text,
    add column if not exists previous_score integer;

-- Preenche os registros existentes a partir da URL salva.
update public.ranking
set site_domain = coalesce(
    nullif(
        lower(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        split_part(
                            regexp_replace(coalesce(full_url, ''), '^[a-zA-Z][a-zA-Z0-9+.-]*://', ''),
                            '/',
                            1
                        ),
                        '^www[.]',
                        ''
                    ),
                    ':[0-9]+$',
                    ''
                ),
                '[?#].*$',
                ''
            )
        ),
        ''
    ),
    nullif(lower(regexp_replace(coalesce(site_name, ''), '[[:space:]]+', '-', 'g')), ''),
    'legacy-ranking-record-' || md5(coalesce(site_name, '') || coalesce(full_url, '') || ctid::text)
)
where site_domain is null or btrim(site_domain) = '';

-- Registros existentes nao possuem comparacao anterior; a proxima auditoria a criara.
update public.ranking
set previous_score = score
where previous_score is null;

alter table public.ranking
    alter column site_domain set not null;

-- Remove somente a chave unica legada de site_name. Ela causava colisao entre
-- dominios distintos que compartilham a mesma primeira palavra.
do $$
declare
    legacy_constraint record;
begin
    for legacy_constraint in
        select con.conname
        from pg_constraint con
        where con.conrelid = 'public.ranking'::regclass
          and con.contype = 'u'
          and cardinality(con.conkey) = 1
          and con.conkey[1] = (
              select attnum
              from pg_attribute
              where attrelid = 'public.ranking'::regclass
                and attname = 'site_name'
          )
    loop
        execute format('alter table public.ranking drop constraint %I', legacy_constraint.conname);
    end loop;

    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.ranking'::regclass
          and conname = 'ranking_site_domain_key'
    ) then
        execute 'alter table public.ranking add constraint ranking_site_domain_key unique (site_domain)';
    end if;
end $$;

commit;
