import { addDays, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CITY } from "@/lib/cities";
import { findBestCompanyMatch } from "@/lib/pdf-match";
import type { ImportCompanyInput } from "@/lib/crm-import";
import type {
  Activity,
  ActivityType,
  AuditStatus,
  Company,
  Contact,
  Deal,
  DealStage,
  ProposedPackage,
} from "@/types";

export type CrmData = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
};

type CompanyRow = {
  id: string;
  name: string;
  member_no: string | null;
  sector: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  city: string | null;
  audit_status: string | null;
  audit_findings: string | null;
  audit_impact: string | null;
  audit_pdf_name: string | null;
  audit_pdf_path: string | null;
  mail_subject: string | null;
  mail_body: string | null;
  created_at: string;
};

type DealRow = {
  id: string;
  company_id: string;
  stage: string;
  proposed_package: string | null;
  estimated_value: number | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
};

type ContactRow = {
  id: string;
  company_id: string;
  full_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
};

type ActivityRow = {
  id: string;
  company_id: string;
  deal_id: string | null;
  type: string;
  note: string | null;
  created_at: string;
};

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    member_no: row.member_no,
    sector: row.sector,
    website: row.website,
    email: row.email,
    phone: row.phone,
    source: row.source,
    city: row.city,
    audit_status: row.audit_status as AuditStatus | null,
    audit_findings: row.audit_findings,
    audit_impact: row.audit_impact,
    audit_pdf_name: row.audit_pdf_name,
    audit_pdf_path: row.audit_pdf_path,
    mail_subject: row.mail_subject,
    mail_body: row.mail_body,
    created_at: row.created_at,
  };
}

function mapDeal(row: DealRow): Deal {
  return {
    id: row.id,
    company_id: row.company_id,
    stage: row.stage as DealStage,
    proposed_package: row.proposed_package as ProposedPackage | null,
    estimated_value: row.estimated_value,
    next_follow_up: row.next_follow_up,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    company_id: row.company_id,
    full_name: row.full_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    linkedin_url: row.linkedin_url,
    is_primary: row.is_primary,
  };
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    company_id: row.company_id,
    deal_id: row.deal_id,
    type: row.type as ActivityType,
    note: row.note,
    created_at: row.created_at,
  };
}

function companyInsertPayload(data: ImportCompanyInput) {
  return {
    name: data.name,
    member_no: data.member_no ?? null,
    sector: data.sector ?? null,
    website: data.website ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    source: data.source ?? null,
    city: data.city ?? DEFAULT_CITY,
    audit_status: data.audit_status ?? "bilinmiyor",
    audit_findings: data.audit_findings ?? null,
    audit_impact: data.audit_impact ?? null,
    audit_pdf_name: data.audit_pdf_name ?? null,
    audit_pdf_path: data.audit_pdf_path ?? null,
    mail_subject: data.mail_subject ?? null,
    mail_body: data.mail_body ?? null,
  };
}

function companyUpdatePayload(data: ImportCompanyInput) {
  return {
    member_no: data.member_no ?? undefined,
    sector: data.sector ?? undefined,
    website: data.website ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    source: data.source ?? undefined,
    city: data.city ?? undefined,
    audit_findings: data.audit_findings ?? undefined,
    audit_impact: data.audit_impact ?? undefined,
    audit_pdf_name: data.audit_pdf_name ?? undefined,
    audit_pdf_path: data.audit_pdf_path ?? undefined,
    mail_subject: data.mail_subject ?? undefined,
    mail_body: data.mail_body ?? undefined,
    audit_status: data.audit_status ?? undefined,
  };
}

export async function fetchCrmData(supabase: SupabaseClient): Promise<CrmData> {
  const [companiesRes, dealsRes, contactsRes, activitiesRes] = await Promise.all([
    supabase.from("crm_companies").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_deals").select("*"),
    supabase.from("crm_contacts").select("*"),
    supabase
      .from("crm_activities")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (companiesRes.error) throw companiesRes.error;
  if (dealsRes.error) throw dealsRes.error;
  if (contactsRes.error) throw contactsRes.error;
  if (activitiesRes.error) throw activitiesRes.error;

  return {
    companies: (companiesRes.data as CompanyRow[]).map(mapCompany),
    deals: (dealsRes.data as DealRow[]).map(mapDeal),
    contacts: (contactsRes.data as ContactRow[]).map(mapContact),
    activities: (activitiesRes.data as ActivityRow[]).map(mapActivity),
  };
}

export async function insertCompany(
  supabase: SupabaseClient,
  data: ImportCompanyInput
): Promise<{ company: Company; deal: Deal }> {
  const { data: row, error } = await supabase
    .from("crm_companies")
    .insert(companyInsertPayload(data))
    .select("*")
    .single();

  if (error) throw error;

  const company = mapCompany(row as CompanyRow);

  const { data: dealRow, error: dealError } = await supabase
    .from("crm_deals")
    .select("*")
    .eq("company_id", company.id)
    .single();

  if (dealError) throw dealError;

  if (data.email || data.phone) {
    const { error: contactError } = await supabase.from("crm_contacts").insert({
      company_id: company.id,
      full_name: "Genel İletişim",
      title: null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      linkedin_url: null,
      is_primary: true,
    });
    if (contactError) throw contactError;
  }

  return { company, deal: mapDeal(dealRow as DealRow) };
}

export async function updateCompanyRow(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Company>
) {
  const { error } = await supabase.from("crm_companies").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyRow(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("crm_companies").delete().eq("id", id);
  if (error) throw error;
}

export async function updateDealRow(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Deal>
) {
  const { error } = await supabase.from("crm_deals").update(data).eq("id", id);
  if (error) throw error;
}

export async function insertContact(
  supabase: SupabaseClient,
  data: Omit<Contact, "id">
): Promise<Contact> {
  if (data.is_primary) {
    await supabase
      .from("crm_contacts")
      .update({ is_primary: false })
      .eq("company_id", data.company_id);
  }

  const { data: row, error } = await supabase
    .from("crm_contacts")
    .insert(data)
    .select("*")
    .single();

  if (error) throw error;
  return mapContact(row as ContactRow);
}

export async function updateContactRow(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Contact>
) {
  if (data.is_primary && data.company_id) {
    await supabase
      .from("crm_contacts")
      .update({ is_primary: false })
      .eq("company_id", data.company_id);
  }

  const { error } = await supabase.from("crm_contacts").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteContactRow(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function insertActivity(
  supabase: SupabaseClient,
  data: Omit<Activity, "id" | "created_at">
): Promise<Activity> {
  const { data: row, error } = await supabase
    .from("crm_activities")
    .insert(data)
    .select("*")
    .single();

  if (error) throw error;
  return mapActivity(row as ActivityRow);
}

export async function bulkImportCompanies(
  supabase: SupabaseClient,
  items: ImportCompanyInput[],
  existingCompanies: Company[]
): Promise<{ created: number; updated: number; newCompanies: Company[]; newDeals: Deal[]; newContacts: Contact[] }> {
  let created = 0;
  let updated = 0;
  const toInsert: ReturnType<typeof companyInsertPayload>[] = [];
  const insertMeta: ImportCompanyInput[] = [];
  const updateTasks: { id: string; data: ImportCompanyInput }[] = [];

  for (const item of items) {
    const hit = findBestCompanyMatch(item.name, existingCompanies);
    if (hit && hit.score >= 0.45) {
      updateTasks.push({ id: hit.company.id, data: item });
      updated++;
    } else {
      toInsert.push(companyInsertPayload(item));
      insertMeta.push(item);
      created++;
    }
  }

  for (const task of updateTasks) {
    const { error } = await supabase
      .from("crm_companies")
      .update(companyUpdatePayload(task.data))
      .eq("id", task.id);
    if (error) throw error;
  }

  let newCompanies: Company[] = [];
  let newDeals: Deal[] = [];
  let newContacts: Contact[] = [];

  if (toInsert.length > 0) {
    const { data: rows, error } = await supabase
      .from("crm_companies")
      .insert(toInsert)
      .select("*");

    if (error) throw error;
    newCompanies = (rows as CompanyRow[]).map(mapCompany);

    const companyIds = newCompanies.map((c) => c.id);
    const { data: dealRows, error: dealError } = await supabase
      .from("crm_deals")
      .select("*")
      .in("company_id", companyIds);

    if (dealError) throw dealError;
    newDeals = (dealRows as DealRow[]).map(mapDeal);

    const contactRows = newCompanies
      .map((company, i) => {
        const meta = insertMeta[i];
        if (!meta.email && !meta.phone) return null;
        return {
          company_id: company.id,
          full_name: "Genel İletişim",
          title: null,
          email: meta.email ?? null,
          phone: meta.phone ?? null,
          linkedin_url: null,
          is_primary: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (contactRows.length > 0) {
      const { data: insertedContacts, error: contactError } = await supabase
        .from("crm_contacts")
        .insert(contactRows)
        .select("*");

      if (contactError) throw contactError;
      newContacts = (insertedContacts as ContactRow[]).map(mapContact);
    }
  }

  return { created, updated, newCompanies, newDeals, newContacts };
}

export function defaultFollowUpDate() {
  return format(addDays(new Date(), 3), "yyyy-MM-dd");
}

export async function clearAllCrmData(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("crm_companies").select("id");
  if (error) throw error;
  if (!data?.length) return;
  const { error: delError } = await supabase
    .from("crm_companies")
    .delete()
    .in(
      "id",
      data.map((r) => r.id)
    );
  if (delError) throw delError;
}

export async function bulkUpdateDealStage(
  supabase: SupabaseClient,
  dealIds: string[],
  stage: DealStage
) {
  if (!dealIds.length) return;
  const { error } = await supabase.from("crm_deals").update({ stage }).in("id", dealIds);
  if (error) throw error;
}

export async function bulkDeleteCompanies(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from("crm_companies").delete().in("id", ids);
  if (error) throw error;
}
