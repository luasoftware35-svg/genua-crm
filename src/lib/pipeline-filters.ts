import type { Company, Deal } from "@/types";

export type PipelineCampaign = "active" | "usak" | "osb-teklif" | "all";

export const PIPELINE_CAMPAIGNS: { value: PipelineCampaign; label: string; description: string }[] = [
  {
    value: "active",
    label: "Aktif Kampanyalar",
    description: "Uşak OSB denetimleri ve Genel OSB teklif 2026",
  },
  {
    value: "usak",
    label: "Uşak OSB",
    description: "Uşak OSB üye firma denetimleri (80 firma)",
  },
  {
    value: "osb-teklif",
    label: "OSB Teklif 2026",
    description: "50 OSB yönetimine gönderilen teklifler",
  },
  { value: "all", label: "Tümü", description: "CRM'deki tüm firmalar" },
];

export function isUsakCampaign(company: Company): boolean {
  return company.source === "UOSB";
}

export type CampaignStats = {
  id: string;
  label: string;
  total: number;
  mailSent: number;
  pending: number;
  withEmail: number;
  noEmail: number;
};

export function getCampaignStats(
  companies: Company[],
  deals: Deal[],
  id: string,
  label: string,
  filter: (company: Company) => boolean
): CampaignStats {
  const filtered = companies.filter(filter);
  const dealByCompany = new Map(deals.map((d) => [d.company_id, d]));
  let mailSent = 0;
  let pending = 0;
  let withEmail = 0;
  let noEmail = 0;

  for (const company of filtered) {
    const deal = dealByCompany.get(company.id);
    const hasEmail = Boolean(company.email?.trim());
    if (hasEmail) withEmail++;
    else noEmail++;
    if (deal?.stage === "mail_atildi") mailSent++;
    else pending++;
  }

  return { id, label, total: filtered.length, mailSent, pending, withEmail, noEmail };
}

export function getActiveCampaignStats(companies: Company[], deals: Deal[]): CampaignStats[] {
  return [
    getCampaignStats(companies, deals, "osb-teklif", "OSB Teklif 2026", isOsbTeklifCampaign),
    getCampaignStats(companies, deals, "usak", "Uşak OSB Denetim", isUsakCampaign),
  ];
}

export function getActiveCampaignPipelineBreakdown(
  companies: Company[],
  deals: Deal[]
): Record<string, number> {
  const companyIds = new Set(companies.filter(isActiveCampaign).map((c) => c.id));
  const counts: Record<string, number> = {};
  for (const deal of deals) {
    if (!companyIds.has(deal.company_id)) continue;
    counts[deal.stage] = (counts[deal.stage] ?? 0) + 1;
  }
  return counts;
}

export function isOsbTeklifCampaign(company: Company): boolean {
  return company.sector === "OSB Yönetimi" && company.source === "OSB";
}

export function isActiveCampaign(company: Company): boolean {
  return isUsakCampaign(company) || isOsbTeklifCampaign(company);
}

export function filterCompaniesByCampaign(
  companies: Company[],
  campaign: PipelineCampaign
): Company[] {
  switch (campaign) {
    case "usak":
      return companies.filter(isUsakCampaign);
    case "osb-teklif":
      return companies.filter(isOsbTeklifCampaign);
    case "active":
      return companies.filter(isActiveCampaign);
    default:
      return companies;
  }
}

export function filterDealsForCompanies(deals: Deal[], companyIds: Set<string>): Deal[] {
  return deals.filter((d) => companyIds.has(d.company_id));
}

export function getPipelineStageCounts(deals: Deal[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const deal of deals) {
    counts[deal.stage] = (counts[deal.stage] ?? 0) + 1;
  }
  return counts;
}
