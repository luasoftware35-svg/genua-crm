export type AuditStatus =
  | "iyi"
  | "orta"
  | "kritik"
  | "bilinmiyor"
  | "website_yok";

export type DealStage =
  | "yeni"
  | "mail_atildi"
  | "yanit_var"
  | "gorusme"
  | "teklif"
  | "kazanildi"
  | "kaybedildi";

export type ProposedPackage =
  | "hizli_mudahale"
  | "orta_paket"
  | "tam_yeniden_yapim";

export type ActivityType = "mail" | "arama" | "toplanti" | "not" | "linkedin";

export interface Company {
  id: string;
  name: string;
  sector: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  source: string | null;
  audit_status: AuditStatus | null;
  audit_findings: string | null;
  audit_impact: string | null;
  audit_pdf_name?: string | null;
  audit_pdf_path?: string | null;
  mail_subject?: string | null;
  mail_body?: string | null;
  member_no?: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  full_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
}

export interface Deal {
  id: string;
  company_id: string;
  stage: DealStage;
  proposed_package: ProposedPackage | null;
  estimated_value: number | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  company_id: string;
  deal_id: string | null;
  type: ActivityType;
  note: string | null;
  created_at: string;
}

export interface CompanyWithDeal extends Company {
  deal: Deal | null;
}
