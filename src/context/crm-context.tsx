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
import type { ImportCompanyInput } from "@/lib/crm-import";
import { createClient } from "@/lib/supabase/client";
import {
  bulkImportCompanies,
  bulkDeleteCompanies as bulkDeleteCompaniesDb,
  bulkUpdateDealStage,
  clearAllCrmData,
  deleteCompanyRow,
  fetchCrmData,
  insertActivity,
  insertCompany,
  insertContact,
  updateCompanyRow,
  updateContactRow,
  updateDealRow,
  deleteContactRow,
} from "@/lib/supabase/crm-service";
import type {
  Activity,
  ActivityType,
  AuditStatus,
  Company,
  Contact,
  Deal,
  DealStage,
} from "@/types";

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

type CrmContextValue = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
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
  importCompanies: (items: ImportCompanyInput[]) => Promise<BulkImportResult>;
  bulkImportFromPdf: (items: ImportCompanyInput[]) => Promise<BulkImportResult>;
  upsertCompanyFromPdf: (data: ImportCompanyInput) => Promise<{ company: Company; isNew: boolean }>;
  updateDeal: (id: string, data: UpdateDealInput) => void;
  updateDealStage: (dealId: string, stage: DealStage) => void;
  createContact: (data: CreateContactInput) => Contact;
  updateContact: (id: string, data: Partial<CreateContactInput>) => void;
  deleteContact: (id: string) => void;
  createActivity: (data: CreateActivityInput) => Activity;
  rescheduleFollowUp: (dealId: string, days: number) => void;
  clearAllData: () => Promise<void>;
  bulkDeleteCompanies: (ids: string[]) => Promise<void>;
  bulkMarkMailSent: (companyIds: string[], note?: string) => Promise<void>;
  refreshData: () => Promise<void>;
};

const CrmContext = createContext<CrmContextValue | null>(null);

function mergeCompanyUpdate(company: Company, data: UpdateCompanyInput): Company {
  return { ...company, ...data };
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCrmData(supabase);
        if (!cancelled) {
          setCompanies(data.companies);
          setDeals(data.deals);
          setContacts(data.contacts);
          setActivities(data.activities);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Veriler yüklenemedi");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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

  const updateCompany = useCallback(
    (id: string, data: UpdateCompanyInput) => {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? mergeCompanyUpdate(c, data) : c))
      );
      updateCompanyRow(supabase, id, data).catch((err) => {
        console.error("Firma güncellenemedi:", err);
        fetchCrmData(supabase).then((fresh) => {
          setCompanies(fresh.companies);
        });
      });
    },
    [supabase]
  );

  const deleteCompany = useCallback(
    (id: string) => {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setDeals((prev) => prev.filter((d) => d.company_id !== id));
      setContacts((prev) => prev.filter((c) => c.company_id !== id));
      setActivities((prev) => prev.filter((a) => a.company_id !== id));
      deleteCompanyRow(supabase, id).catch((err) => {
        console.error("Firma silinemedi:", err);
        fetchCrmData(supabase).then((fresh) => {
          setCompanies(fresh.companies);
          setDeals(fresh.deals);
          setContacts(fresh.contacts);
          setActivities(fresh.activities);
        });
      });
    },
    [supabase]
  );

  const createCompanyWithDeal = useCallback(
    (data: ImportCompanyInput): Company => {
      const now = new Date().toISOString();
      const tempId = crypto.randomUUID();
      const company: Company = {
        id: tempId,
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
        id: crypto.randomUUID(),
        company_id: tempId,
        stage: "yeni",
        proposed_package: null,
        estimated_value: null,
        next_follow_up: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        created_at: now,
        updated_at: now,
      };

      setCompanies((prev) => [...prev, company]);
      setDeals((prev) => [...prev, deal]);

      insertCompany(supabase, data)
        .then(({ company: saved, deal: savedDeal }) => {
          setCompanies((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
          setDeals((prev) => prev.map((d) => (d.company_id === tempId ? savedDeal : d)));
          if (data.email || data.phone) {
            fetchCrmData(supabase).then((fresh) => setContacts(fresh.contacts));
          }
        })
        .catch((err) => {
          console.error("Firma oluşturulamadı:", err);
          setCompanies((prev) => prev.filter((c) => c.id !== tempId));
          setDeals((prev) => prev.filter((d) => d.company_id !== tempId));
        });

      return company;
    },
    [supabase]
  );

  const bulkImportFromPdf = useCallback(
    async (items: ImportCompanyInput[]): Promise<BulkImportResult> => {
      const importResult = await bulkImportCompanies(supabase, items, companies);
      const fresh = await fetchCrmData(supabase);
      setCompanies(fresh.companies);
      setDeals(fresh.deals);
      setContacts(fresh.contacts);
      setActivities(fresh.activities);
      return { created: importResult.created, updated: importResult.updated };
    },
    [supabase, companies]
  );

  const importCompanies = bulkImportFromPdf;

  const upsertCompanyFromPdf = useCallback(
    async (data: ImportCompanyInput): Promise<{ company: Company; isNew: boolean }> => {
      const importResult = await bulkImportCompanies(supabase, [data], companies);
      const fresh = await fetchCrmData(supabase);
      setCompanies(fresh.companies);
      setDeals(fresh.deals);
      setContacts(fresh.contacts);
      const company =
        fresh.companies.find((c) => c.name === data.name) ?? fresh.companies.at(-1)!;
      return { company, isNew: importResult.created > 0 };
    },
    [supabase, companies]
  );

  const updateDeal = useCallback(
    (id: string, data: UpdateDealInput) => {
      const updatedAt = new Date().toISOString();
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data, updated_at: updatedAt } : d))
      );
      updateDealRow(supabase, id, data).catch((err) => {
        console.error("Deal güncellenemedi:", err);
        fetchCrmData(supabase).then((fresh) => setDeals(fresh.deals));
      });
    },
    [supabase]
  );

  const updateDealStage = useCallback(
    (dealId: string, stage: DealStage) => updateDeal(dealId, { stage }),
    [updateDeal]
  );

  const createContact = useCallback(
    (data: CreateContactInput): Contact => {
      const tempId = crypto.randomUUID();
      const contact: Contact = { ...data, id: tempId };

      setContacts((prev) => {
        const base =
          contact.is_primary
            ? prev.map((c) =>
                c.company_id === contact.company_id ? { ...c, is_primary: false } : c
              )
            : prev;
        return [...base, contact];
      });

      insertContact(supabase, data)
        .then((saved) => {
          setContacts((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
        })
        .catch((err) => {
          console.error("Kişi oluşturulamadı:", err);
          setContacts((prev) => prev.filter((c) => c.id !== tempId));
        });

      return contact;
    },
    [supabase]
  );

  const updateContact = useCallback(
    (id: string, data: Partial<CreateContactInput>) => {
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
      updateContactRow(supabase, id, data).catch((err) => {
        console.error("Kişi güncellenemedi:", err);
        fetchCrmData(supabase).then((fresh) => setContacts(fresh.contacts));
      });
    },
    [supabase]
  );

  const deleteContact = useCallback(
    (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      deleteContactRow(supabase, id).catch((err) => {
        console.error("Kişi silinemedi:", err);
        fetchCrmData(supabase).then((fresh) => setContacts(fresh.contacts));
      });
    },
    [supabase]
  );

  const createActivity = useCallback(
    (data: CreateActivityInput): Activity => {
      const tempId = crypto.randomUUID();
      const activity: Activity = {
        id: tempId,
        company_id: data.company_id,
        deal_id: data.deal_id ?? null,
        type: data.type,
        note: data.note,
        created_at: new Date().toISOString(),
      };

      setActivities((prev) => [activity, ...prev]);

      insertActivity(supabase, {
        company_id: data.company_id,
        deal_id: data.deal_id ?? null,
        type: data.type,
        note: data.note,
      })
        .then((saved) => {
          setActivities((prev) => prev.map((a) => (a.id === tempId ? saved : a)));
        })
        .catch((err) => {
          console.error("Aktivite oluşturulamadı:", err);
          setActivities((prev) => prev.filter((a) => a.id !== tempId));
        });

      return activity;
    },
    [supabase]
  );

  const rescheduleFollowUp = useCallback(
    (dealId: string, days: number) => {
      const newDate = format(addDays(new Date(), days), "yyyy-MM-dd");
      updateDeal(dealId, { next_follow_up: newDate });
    },
    [updateDeal]
  );

  const refreshData = useCallback(async () => {
    const fresh = await fetchCrmData(supabase);
    setCompanies(fresh.companies);
    setDeals(fresh.deals);
    setContacts(fresh.contacts);
    setActivities(fresh.activities);
  }, [supabase]);

  const clearAllData = useCallback(async () => {
    await clearAllCrmData(supabase);
    setCompanies([]);
    setDeals([]);
    setContacts([]);
    setActivities([]);
  }, [supabase]);

  const bulkDeleteCompanies = useCallback(
    async (ids: string[]) => {
      setCompanies((prev) => prev.filter((c) => !ids.includes(c.id)));
      setDeals((prev) => prev.filter((d) => !ids.includes(d.company_id)));
      setContacts((prev) => prev.filter((c) => !ids.includes(c.company_id)));
      setActivities((prev) => prev.filter((a) => !ids.includes(a.company_id)));
      await bulkDeleteCompaniesDb(supabase, ids);
    },
    [supabase]
  );

  const bulkMarkMailSent = useCallback(
    async (companyIds: string[], note = "Titan Mail ile gönderildi.") => {
      const dealIds = deals
        .filter((d) => companyIds.includes(d.company_id))
        .map((d) => d.id);
      if (!dealIds.length) return;

      setDeals((prev) =>
        prev.map((d) =>
          dealIds.includes(d.id) ? { ...d, stage: "mail_atildi" as DealStage } : d
        )
      );
      await bulkUpdateDealStage(supabase, dealIds, "mail_atildi");

      for (const companyId of companyIds) {
        const deal = deals.find((d) => d.company_id === companyId);
        createActivity({
          company_id: companyId,
          deal_id: deal?.id ?? null,
          type: "mail",
          note,
        });
      }
    },
    [supabase, deals, createActivity]
  );

  const value = useMemo<CrmContextValue>(
    () => ({
      companies,
      deals,
      contacts,
      activities,
      isLoading,
      error,
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
      clearAllData,
      bulkDeleteCompanies,
      bulkMarkMailSent,
      refreshData,
    }),
    [
      companies,
      deals,
      contacts,
      activities,
      isLoading,
      error,
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
      clearAllData,
      bulkDeleteCompanies,
      bulkMarkMailSent,
      refreshData,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
