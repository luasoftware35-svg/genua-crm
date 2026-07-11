alter table public.crm_companies
  add column if not exists mail_subject text,
  add column if not exists mail_body text,
  add column if not exists audit_pdf_path text;
