-- Genua CRM schema (crm_ prefix — mevcut Supabase projesiyle çakışmayı önler)

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  member_no text,
  sector text,
  website text,
  email text,
  phone text,
  source text,
  city text,
  audit_status text,
  audit_findings text,
  audit_impact text,
  audit_pdf_name text,
  created_at timestamptz default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.crm_companies(id) on delete cascade,
  full_name text,
  title text,
  email text,
  phone text,
  linkedin_url text,
  is_primary boolean default false
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.crm_companies(id) on delete cascade,
  stage text not null default 'yeni',
  proposed_package text,
  estimated_value numeric,
  next_follow_up date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.crm_companies(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete set null,
  type text not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_crm_companies_source on public.crm_companies(source);
create index if not exists idx_crm_companies_member_no on public.crm_companies(member_no);
create index if not exists idx_crm_companies_audit_status on public.crm_companies(audit_status);
create index if not exists idx_crm_deals_stage on public.crm_deals(stage);
create index if not exists idx_crm_deals_next_follow_up on public.crm_deals(next_follow_up);
create index if not exists idx_crm_contacts_company_id on public.crm_contacts(company_id);
create index if not exists idx_crm_activities_company_id on public.crm_activities(company_id);

create or replace function public.handle_new_crm_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_deals (company_id, stage, next_follow_up)
  values (new.id, 'yeni', (current_date + interval '3 days')::date);
  return new;
end;
$$;

drop trigger if exists on_crm_company_created on public.crm_companies;
create trigger on_crm_company_created
  after insert on public.crm_companies
  for each row
  execute function public.handle_new_crm_company();

create or replace function public.handle_crm_deal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_crm_deal_updated on public.crm_deals;
create trigger on_crm_deal_updated
  before update on public.crm_deals
  for each row
  execute function public.handle_crm_deal_updated_at();

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;

create policy "Authenticated users full access on crm_companies"
  on public.crm_companies for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on crm_contacts"
  on public.crm_contacts for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on crm_deals"
  on public.crm_deals for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on crm_activities"
  on public.crm_activities for all
  to authenticated
  using (true)
  with check (true);
