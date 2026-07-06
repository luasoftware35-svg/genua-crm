"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addDays, format } from "date-fns";
import { DEFAULT_CITY, cityToSlug } from "@/lib/cities";
import {
  bulkUpsertCompanies,
  type ImportCompanyInput,
} from "@/lib/crm-import";
import { loadCrmState, saveCrmState } from "@/lib/crm-storage";
import type {
  Activity,
  ActivityType,
  AuditStatus,
  Company,
  Contact,
  Deal,
  DealStage,
} from "@/types";

type CrmState = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
};

type UpdateCompanyInput = Partial<
  Pick<
    Company,
    | "name"
    | "sector"
    | "website"
    | "email"
    | "phone"
    | "source"
    | "city"
    | "audit_status"
    | "audit_findings"
    | "audit_impact"
    | "audit_pdf_name"
    | "member_no"
  >
>;

type UpdateDealInput = Partial<
  Pick<Deal, "stage" | "proposed_package" | "estimated_value" | "next_follow_up">
>;

type CreateContactInput = Omit<Contact, "id">;
type CreateActivityInput = {
  company_id: string;
  deal_id?: string | null;
  type: ActivityType;
  note: string;
};

type BulkImportResult = { created: number; updated: number };

type CrmContextValue = CrmState & {
  getCompanyById: (id: string) => Company | undefined;
  getDealByCompanyId: (companyId: string) => Deal | undefined;
  getContactsByCompanyId: (companyId: string) => Contact[];
  getActivitiesByCompanyId: (companyId: string) => Activity[];
  getCompaniesWithDeals: () => (Company & { deal: Deal | null })[];
  getCities: () => { name: string; slug: string; count: number }[];
  getCompaniesByCity: (city: string) => (Company & { deal: Deal | null })[];
  getCityContacts: (city: string) => (Contact & { company: Company })[];
  getSourceBreakdown: () => { name: string; value: number }[];
  getPipelineBreakdown: () => Record<string, number>;
  getTodayFollowUps: () => { deal: Deal; company: Company }[];
  getWeekFollowUps: () => { deal: Deal; company: Company }[];
  updateCompany: (id: string, data: UpdateCompanyInput) => void;
  deleteCompany: (id: string) => void;
  createCompany: (data: ImportCompanyInput) => Company;
  importCompanies: (items: ImportCompanyInput[]) => BulkImportResult;
  bulkImportFromPdf: (items: ImportCompanyInput[]) => BulkImportResult;
  upsertCompanyFromPdf: (data: ImportCompanyInput) => { company: Company; isNew: boolean };
  updateDeal: (id: string, data: UpdateDealInput) => void;
  updateDealStage: (dealId: string, stage: DealStage) => void;
  createContact: (data: CreateContactInput) => Contact;
  updateContact: (id: string, data: Partial<CreateContactInput>) => void;
  deleteContact: (id: string) => void;
  createActivity: (data: CreateActivityInput) => Activity;
  rescheduleFollowUp: (dealId: string, days: number) => void;
};

const CrmContext = createContext<CrmContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(() => loadCrmState().companies);
  const [deals, setDeals] = useState<Deal[]>(() => loadCrmState().deals);
  const [contacts, setContacts] = useState<Contact[]>(() => loadCrmState().contacts);
  const [activities, setActivities] = useState<Activity[]>(() => loadCrmState().activities);

  useEffect(() => {
    saveCrmState({ companies, deals, contacts, activities });
  }, [companies, deals, contacts, activities]);

  const getCompanyById = useCallback(
    (id: string) => companies.find((c) => c.id === id),
    [companies]
  );

  const getDealByCompanyId = useCallback(
    (companyId: string) => deals.find((d) => d.company_id === companyId),
    [deals]
  );

  const getContactsByCompanyId = useCallback(
    (companyId: string) => contacts.filter((c) => c.company_id === companyId),
    [contacts]
  );

  const getActivitiesByCompanyId = useCallback(
    (companyId: string) =>
      activities
        .filter((a) => a.company_id === companyId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities]
  );

  const getCompaniesWithDeals = useCallback(
    () =>
      companies.map((company) => ({
        ...company,
        deal: deals.find((d) => d.company_id === company.id) ?? null,
      })),
    [companies, deals]
  );

  const getCities = useCallback(() => {
    const counts = new Map<string, number>();
    for (const company of companies) {
      const city = company.city ?? DEFAULT_CITY;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, slug: cityToSlug(name), count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  const getCompaniesByCity = useCallback(
    (city: string) =>
      getCompaniesWithDeals().filter((c) => (c.city ?? DEFAULT_CITY) === city),
    [getCompaniesWithDeals]
  );

  const getCityContacts = useCallback(
    (city: string) => {
      const cityCompanyIds = new Set(
        companies.filter((c) => (c.city ?? DEFAULT_CITY) === city).map((c) => c.id)
      );
      return contacts
        .filter((ct) => cityCompanyIds.has(ct.company_id))
        .map((ct) => {
          const company = companies.find((c) => c.id === ct.company_id)!;
          return { ...ct, company };
        });
    },
    [companies, contacts]
  );

  const getSourceBreakdown = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const company of companies) {
      const source = company.source ?? "Diğer";
      counts[source] = (counts[source] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [companies]);

  const getPipelineBreakdown = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const deal of deals) {
      counts[deal.stage] = (counts[deal.stage] ?? 0) + 1;
    }
    return counts;
  }, [deals]);

  const getTodayFollowUps = useCallback(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return deals
      .filter((d) => d.next_follow_up && d.next_follow_up <= todayStr)
      .map((deal) => {
        const company = companies.find((c) => c.id === deal.company_id);
        return company ? { deal, company } : null;
      })
      .filter((item): item is { deal: Deal; company: Company } => item !== null);
  }, [deals, companies]);

  const getWeekFollowUps = useCallback(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const weekEnd = format(addDays(today, 7), "yyyy-MM-dd");
    return deals
      .filter((d) => d.next_follow_up && d.next_follow_up >= todayStr && d.next_follow_up <= weekEnd)
      .map((deal) => {
        const company = companies.find((c) => c.id === deal.company_id);
        return company ? { deal, company } : null;
      })
      .filter((item): item is { deal: Deal; company: Company } => item !== null)
      .sort((a, b) => (a.deal.next_follow_up ?? "").localeCompare(b.deal.next_follow_up ?? ""));
  }, [deals, companies]);

  const updateCompany = useCallback((id: string, data: UpdateCompanyInput) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setDeals((prev) => prev.filter((d) => d.company_id !== id));
    setContacts((prev) => prev.filter((c) => c.company_id !== id));
    setActivities((prev) => prev.filter((a) => a.company_id !== id));
  }, []);

  const createCompanyWithDeal = useCallback((data: ImportCompanyInput): Company => {
    const now = new Date().toISOString();
    const company: Company = {
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
      created_at: now,
    };
    const deal: Deal = {
      id: newId("d"),
      company_id: company.id,
      stage: "yeni",
      proposed_package: null,
      estimated_value: null,
      next_follow_up: format(addDays(new Date(), 3), "yyyy-MM-dd"),
      created_at: now,
      updated_at: now,
    };
    setCompanies((prev) => [...prev, company]);
    setDeals((prev) => [...prev, deal]);
    return company;
  }, []);

  const applyBulkImport = useCallback(
    (items: ImportCompanyInput[]): BulkImportResult => {
      const current = { companies, deals, contacts, activities };
      const { created, updated, state } = bulkUpsertCompanies(items, current);
      setCompanies(state.companies);
      setDeals(state.deals);
      setContacts(state.contacts);
      return { created, updated };
    },
    [companies, deals, contacts, activities]
  );

  const bulkImportFromPdf = applyBulkImport;

  const importCompanies = useCallback(
    (items: ImportCompanyInput[]) => applyBulkImport(items),
    [applyBulkImport]
  );

  const upsertCompanyFromPdf = useCallback(
    (data: ImportCompanyInput): { company: Company; isNew: boolean } => {
      const result = bulkUpsertCompanies([data], { companies, deals, contacts, activities });
      setCompanies(result.state.companies);
      setDeals(result.state.deals);
      setContacts(result.state.contacts);
      const company =
        result.state.companies.find((c) => c.name === data.name) ??
        result.state.companies.at(-1)!;
      return { company, isNew: result.created > 0 };
    },
    [companies, deals, contacts, activities]
  );

  const updateDeal = useCallback((id: string, data: UpdateDealInput) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d
      )
    );
  }, []);

  const updateDealStage = useCallback(
    (dealId: string, stage: DealStage) => updateDeal(dealId, { stage }),
    [updateDeal]
  );

  const createContact = useCallback((data: CreateContactInput) => {
    const contact: Contact = { ...data, id: newId("ct") };
    if (contact.is_primary) {
      setContacts((prev) =>
        prev
          .map((c) =>
            c.company_id === contact.company_id ? { ...c, is_primary: false } : c
          )
          .concat(contact)
      );
    } else {
      setContacts((prev) => [...prev, contact]);
    }
    return contact;
  }, []);

  const updateContact = useCallback((id: string, data: Partial<CreateContactInput>) => {
    setContacts((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      if (data.is_primary) {
        const target = updated.find((c) => c.id === id);
        if (target) {
          return updated.map((c) =>
            c.company_id === target.company_id
              ? { ...c, is_primary: c.id === id }
              : c
          );
        }
      }
      return updated;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createActivity = useCallback((data: CreateActivityInput) => {
    const activity: Activity = {
      id: newId("a"),
      company_id: data.company_id,
      deal_id: data.deal_id ?? null,
      type: data.type,
      note: data.note,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [activity, ...prev]);
    return activity;
  }, []);

  const rescheduleFollowUp = useCallback(
    (dealId: string, days: number) => {
      const newDate = format(addDays(new Date(), days), "yyyy-MM-dd");
      updateDeal(dealId, { next_follow_up: newDate });
    },
    [updateDeal]
  );

  const value = useMemo<CrmContextValue>(
    () => ({
      companies,
      deals,
      contacts,
      activities,
      getCompanyById,
      getDealByCompanyId,
      getContactsByCompanyId,
      getActivitiesByCompanyId,
      getCompaniesWithDeals,
      getCities,
      getCompaniesByCity,
      getCityContacts,
      getSourceBreakdown,
      getPipelineBreakdown,
      getTodayFollowUps,
      getWeekFollowUps,
      updateCompany,
      deleteCompany,
      createCompany: createCompanyWithDeal,
      importCompanies,
      bulkImportFromPdf,
      upsertCompanyFromPdf,
      updateDeal,
      updateDealStage,
      createContact,
      updateContact,
      deleteContact,
      createActivity,
      rescheduleFollowUp,
    }),
    [
      companies,
      deals,
      contacts,
      activities,
      getCompanyById,
      getDealByCompanyId,
      getContactsByCompanyId,
      getActivitiesByCompanyId,
      getCompaniesWithDeals,
      getCities,
      getCompaniesByCity,
      getCityContacts,
      getSourceBreakdown,
      getPipelineBreakdown,
      getTodayFollowUps,
      getWeekFollowUps,
      updateCompany,
      deleteCompany,
      createCompanyWithDeal,
      importCompanies,
      bulkImportFromPdf,
      upsertCompanyFromPdf,
      updateDeal,
      updateDealStage,
      createContact,
      updateContact,
      deleteContact,
      createActivity,
      rescheduleFollowUp,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
