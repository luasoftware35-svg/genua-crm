import { addDays, format } from "date-fns";
import { DEFAULT_CITY } from "@/lib/cities";
import { findBestCompanyMatch } from "@/lib/pdf-match";
import type { Activity, AuditStatus, Company, Contact, Deal } from "@/types";

export type ImportCompanyInput = {
  name: string;
  member_no?: string | null;
  sector?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  city?: string | null;
  audit_findings?: string | null;
  audit_impact?: string | null;
  audit_pdf_name?: string | null;
  audit_pdf_path?: string | null;
  mail_subject?: string | null;
  mail_body?: string | null;
  audit_status?: AuditStatus | null;
};

export type CrmBatchState = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
};

export type BulkUpsertResult = {
  created: number;
  updated: number;
  state: CrmBatchState;
};

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function buildCompany(data: ImportCompanyInput): Company {
  const now = new Date().toISOString();
  return {
    id: newId("c"),
    name: data.name,
    member_no: data.member_no ?? null,
    sector: data.sector ?? null,
    website: data.website ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    source: data.source ?? null,
    city: data.city ?? DEFAULT_CITY,
    audit_status: (data.audit_status ?? "bilinmiyor") as AuditStatus,
    audit_findings: data.audit_findings ?? null,
    audit_impact: data.audit_impact ?? null,
    audit_pdf_name: data.audit_pdf_name ?? null,
    audit_pdf_path: data.audit_pdf_path ?? null,
    mail_subject: data.mail_subject ?? null,
    mail_body: data.mail_body ?? null,
    created_at: now,
  };
}

function buildDeal(companyId: string): Deal {
  const now = new Date().toISOString();
  return {
    id: newId("d"),
    company_id: companyId,
    stage: "yeni",
    proposed_package: null,
    estimated_value: null,
    next_follow_up: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    created_at: now,
    updated_at: now,
  };
}

function buildContact(companyId: string, data: ImportCompanyInput): Contact {
  return {
    id: newId("ct"),
    company_id: companyId,
    full_name: "Genel İletişim",
    title: null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    linkedin_url: null,
    is_primary: true,
  };
}

export function bulkUpsertCompanies(
  items: ImportCompanyInput[],
  state: CrmBatchState
): BulkUpsertResult {
  let created = 0;
  let updated = 0;
  const companies = [...state.companies];
  const deals = [...state.deals];
  const contacts = [...state.contacts];

  for (const item of items) {
    const hit = findBestCompanyMatch(item.name, companies);
    if (hit && hit.score >= 0.45) {
      const idx = companies.findIndex((c) => c.id === hit.company.id);
      companies[idx] = {
        ...companies[idx],
        member_no: item.member_no ?? companies[idx].member_no,
        sector: item.sector ?? companies[idx].sector,
        website: item.website ?? companies[idx].website,
        email: item.email ?? companies[idx].email,
        phone: item.phone ?? companies[idx].phone,
        source: item.source ?? companies[idx].source,
        city: item.city ?? companies[idx].city,
        audit_findings: item.audit_findings ?? companies[idx].audit_findings,
        audit_impact: item.audit_impact ?? companies[idx].audit_impact,
        audit_pdf_name: item.audit_pdf_name ?? companies[idx].audit_pdf_name,
        audit_pdf_path: item.audit_pdf_path ?? companies[idx].audit_pdf_path,
        mail_subject: item.mail_subject ?? companies[idx].mail_subject,
        mail_body: item.mail_body ?? companies[idx].mail_body,
        audit_status: item.audit_status ?? companies[idx].audit_status,
      };
      updated++;
      continue;
    }

    const company = buildCompany(item);
    companies.push(company);
    deals.push(buildDeal(company.id));
    if (item.email || item.phone) {
      contacts.push(buildContact(company.id, item));
    }
    created++;
  }

  return {
    created,
    updated,
    state: { ...state, companies, deals, contacts },
  };
}
