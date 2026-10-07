begin;

-- Neon's managed auth schema is owned by cloud_admin. Application owners
-- cannot grant its USAGE privilege to Data API roles. Resolve the verified
-- request subject through a narrowly scoped definer function instead.
-- The function takes no arguments and never accepts a client-supplied identity.
create or replace function public.request_user_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select auth.user_id(); $$;

revoke all on function public.request_user_id() from public;
grant execute on function public.request_user_id() to anonymous, authenticated;

do $$
declare
  policy record;
  clauses text;
begin
  for policy in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual like '%auth.user_id()%' or with_check like '%auth.user_id()%')
  loop
    clauses := '';
    if policy.qual is not null then
      clauses := clauses || ' using (' || replace(policy.qual, 'auth.user_id()', 'public.request_user_id()') || ')';
    end if;
    if policy.with_check is not null then
      clauses := clauses || ' with check (' || replace(policy.with_check, 'auth.user_id()', 'public.request_user_id()') || ')';
    end if;
    execute format('alter policy %I on %I.%I%s', policy.policyname, policy.schemaname, policy.tablename, clauses);
  end loop;
end;
$$;

commit;
