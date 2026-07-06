import type { ActivityType, AuditStatus, DealStage, ProposedPackage } from "@/types";

export const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "mail_atildi", label: "Mail Atıldı" },
  { value: "yanit_var", label: "Yanıt Var" },
  { value: "gorusme", label: "Görüşme" },
  { value: "teklif", label: "Teklif" },
  { value: "kazanildi", label: "Kazanıldı" },
  { value: "kaybedildi", label: "Kaybedildi" },
];

export const AUDIT_STATUSES: { value: AuditStatus; label: string; color: string }[] = [
  { value: "iyi", label: "İyi", color: "bg-emerald-100 text-emerald-800" },
  { value: "orta", label: "Orta", color: "bg-amber-100 text-amber-800" },
  { value: "kritik", label: "Kritik", color: "bg-red-100 text-red-800" },
  { value: "bilinmiyor", label: "Bilinmiyor", color: "bg-gray-100 text-gray-800" },
  { value: "website_yok", label: "Website Yok", color: "bg-slate-100 text-slate-800" },
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "mail", label: "E-posta" },
  { value: "arama", label: "Arama" },
  { value: "toplanti", label: "Toplantı" },
  { value: "not", label: "Not" },
  { value: "linkedin", label: "LinkedIn" },
];

export const PROPOSED_PACKAGES: { value: ProposedPackage; label: string }[] = [
  { value: "hizli_mudahale", label: "Hızlı Müdahale" },
  { value: "orta_paket", label: "Orta Paket" },
  { value: "tam_yeniden_yapim", label: "Tam Yeniden Yapım" },
];

export const SOURCES = ["BOSB", "SOSB", "DOSB", "Diğer"] as const;

export function getStageLabel(stage: DealStage): string {
  return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function getAuditStatusLabel(status: AuditStatus | null): string {
  if (!status) return "—";
  return AUDIT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function getPackageLabel(pkg: ProposedPackage | null): string {
  if (!pkg) return "—";
  return PROPOSED_PACKAGES.find((p) => p.value === pkg)?.label ?? pkg;
}

export function getActivityTypeLabel(type: ActivityType): string {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getAuditStatusColor(status: AuditStatus | null): string {
  if (!status) return "bg-gray-100 text-gray-800";
  return AUDIT_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}
