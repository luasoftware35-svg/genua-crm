-- Genua CRM initial schema

-- companies (firmalar)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  website text,
  email text,
  phone text,
  source text,
  city text,
  audit_status text,
  audit_findings text,
  audit_impact text,
  created_at timestamptz default now()
);

-- contacts (firma içindeki kişiler)
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text,
  title text,
  email text,
  phone text,
  linkedin_url text,
  is_primary boolean default false
);

-- deals (satış fırsatları / pipeline kartları)
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  stage text not null default 'yeni',
  proposed_package text,
  estimated_value numeric,
  next_follow_up date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- activities (aktivite/etkileşim geçmişi)
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  type text not null,
  note text,
  created_at timestamptz default now()
);

-- indexes
create index idx_companies_source on public.companies(source);
create index idx_companies_audit_status on public.companies(audit_status);
create index idx_deals_stage on public.deals(stage);
create index idx_deals_next_follow_up on public.deals(next_follow_up);
create index idx_contacts_company_id on public.contacts(company_id);
create index idx_activities_company_id on public.activities(company_id);

-- auto-create deal when company is inserted
create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deals (company_id, stage)
  values (new.id, 'yeni');
  return new;
end;
$$;

create trigger on_company_created
  after insert on public.companies
  for each row
  execute function public.handle_new_company();

-- updated_at trigger for deals
create or replace function public.handle_deal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_deal_updated
  before update on public.deals
  for each row
  execute function public.handle_deal_updated_at();

-- RLS
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

-- authenticated user can do everything (single-user agency scenario)
create policy "Authenticated users full access on companies"
  on public.companies for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on contacts"
  on public.contacts for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on deals"
  on public.deals for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users full access on activities"
  on public.activities for all
  to authenticated
  using (true)
  with check (true);
