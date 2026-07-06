import { addDays, format, subDays } from "date-fns";
import type { Activity, Company, Contact, Deal } from "@/types";

const today = new Date();

export const mockCompanies: Company[] = [
  {
    id: "c1",
    name: "Anadolu Makina San. Tic. A.Ş.",
    sector: "Makine",
    website: "https://anadolumakina.com.tr",
    email: "info@anadolumakina.com.tr",
    phone: "+90 224 123 4567",
    source: "BOSB",
    city: "Bursa",
    audit_status: "kritik",
    audit_findings: "Mobil uyumluluk yok, SSL sertifikası süresi dolmuş, sayfa yükleme süresi 8sn.",
    audit_impact: "Potansiyel müşterilerin %60'ı mobil cihazdan geliyor; dönüşüm kaybı yüksek.",
    created_at: subDays(today, 30).toISOString(),
  },
  {
    id: "c2",
    name: "Delta Plastik Ltd. Şti.",
    sector: "Plastik",
    website: "https://deltaplastik.com",
    email: "iletisim@deltaplastik.com",
    phone: "+90 224 234 5678",
    source: "BOSB",
    city: "Bursa",
    audit_status: "orta",
    audit_findings: "Eski tasarım, SEO meta etiketleri eksik, iletişim formu çalışmıyor.",
    audit_impact: "Organik trafik düşük, lead toplama kapasitesi sınırlı.",
    created_at: subDays(today, 28).toISOString(),
  },
  {
    id: "c3",
    name: "Ege Tekstil A.Ş.",
    sector: "Tekstil",
    website: "https://egetekstil.com.tr",
    email: "export@egetekstil.com.tr",
    phone: "+90 224 345 6789",
    source: "DOSB",
    city: "Bursa",
    audit_status: "iyi",
    audit_findings: "Genel olarak iyi durumda, sadece blog bölümü güncel değil.",
    audit_impact: "Düşük öncelikli iyileştirmeler.",
    created_at: subDays(today, 25).toISOString(),
  },
  {
    id: "c4",
    name: "Ferhat Otomotiv Yan San.",
    sector: "Otomotiv",
    website: "https://ferhatotomotiv.com",
    email: "satis@ferhatotomotiv.com",
    phone: "+90 224 456 7890",
    source: "BOSB",
    city: "Bursa",
    audit_status: "kritik",
    audit_findings: "Website erişilemiyor (503), domain yenileme gerekli.",
    audit_impact: "Firma dijitalde tamamen görünmez durumda.",
    created_at: subDays(today, 22).toISOString(),
  },
  {
    id: "c5",
    name: "Güneş Enerji Sistemleri",
    sector: "Enerji",
    website: "https://gunesenerji.com.tr",
    email: "info@gunesenerji.com.tr",
    phone: "+90 224 567 8901",
    source: "DOSB",
    city: "Bursa",
    audit_status: "orta",
    audit_findings: "Görsel kalite düşük, referans projeler bölümü eksik.",
    audit_impact: "Güven algısı zayıf, teklif dönüşümü düşük.",
    created_at: subDays(today, 20).toISOString(),
  },
  {
    id: "c6",
    name: "Hidrolik Pres San. Ltd.",
    sector: "Makine",
    website: "https://hidrolikpres.com",
    email: "info@hidrolikpres.com",
    phone: "+90 224 678 9012",
    source: "BOSB",
    city: "Bursa",
    audit_status: "bilinmiyor",
    audit_findings: null,
    audit_impact: null,
    created_at: subDays(today, 18).toISOString(),
  },
  {
    id: "c7",
    name: "İpek Gıda San. Tic.",
    sector: "Gıda",
    website: null,
    email: "info@ipekgida.com",
    phone: "+90 224 789 0123",
    source: "DOSB",
    city: "Bursa",
    audit_status: "website_yok",
    audit_findings: "Firmanın aktif bir web sitesi bulunmuyor.",
    audit_impact: "Tam yeniden yapım fırsatı.",
    created_at: subDays(today, 15).toISOString(),
  },
  {
    id: "c8",
    name: "Kale Kimya A.Ş.",
    sector: "Kimya",
    website: "https://kalekimya.com.tr",
    email: "info@kalekimya.com.tr",
    phone: "+90 224 890 1234",
    source: "BOSB",
    city: "Bursa",
    audit_status: "kritik",
    audit_findings: "GDPR/KVKK uyumsuz çerez banner, eski jQuery kütüphaneleri.",
    audit_impact: "Yasal risk ve güvenlik açıkları.",
    created_at: subDays(today, 12).toISOString(),
  },
  {
    id: "c9",
    name: "Lider Ambalaj Ltd.",
    sector: "Ambalaj",
    website: "https://liderambalaj.com",
    email: "satis@liderambalaj.com",
    phone: "+90 224 901 2345",
    source: "BOSB",
    city: "Bursa",
    audit_status: "orta",
    audit_findings: "Ürün kataloğu PDF olarak sunuluyor, interaktif değil.",
    audit_impact: "B2B satış sürecinde sürtünme.",
    created_at: subDays(today, 10).toISOString(),
  },
  {
    id: "c10",
    name: "Mavi Deniz Lojistik",
    sector: "Lojistik",
    website: "https://mavideniz.com.tr",
    email: "info@mavideniz.com.tr",
    phone: "+90 224 012 3456",
    source: "DOSB",
    city: "Bursa",
    audit_status: "iyi",
    audit_findings: "Modern tasarım, küçük UX iyileştirmeleri önerilebilir.",
    audit_impact: "Hızlı müdahale paketi yeterli.",
    created_at: subDays(today, 8).toISOString(),
  },
];

export const mockDeals: Deal[] = [
  { id: "d1", company_id: "c1", stage: "gorusme", proposed_package: "tam_yeniden_yapim", estimated_value: 85000, next_follow_up: format(today, "yyyy-MM-dd"), created_at: subDays(today, 30).toISOString(), updated_at: subDays(today, 2).toISOString() },
  { id: "d2", company_id: "c2", stage: "mail_atildi", proposed_package: "orta_paket", estimated_value: 45000, next_follow_up: format(today, "yyyy-MM-dd"), created_at: subDays(today, 28).toISOString(), updated_at: subDays(today, 5).toISOString() },
  { id: "d3", company_id: "c3", stage: "yeni", proposed_package: null, estimated_value: null, next_follow_up: format(addDays(today, 3), "yyyy-MM-dd"), created_at: subDays(today, 25).toISOString(), updated_at: subDays(today, 25).toISOString() },
  { id: "d4", company_id: "c4", stage: "teklif", proposed_package: "tam_yeniden_yapim", estimated_value: 120000, next_follow_up: format(addDays(today, 1), "yyyy-MM-dd"), created_at: subDays(today, 22).toISOString(), updated_at: subDays(today, 1).toISOString() },
  { id: "d5", company_id: "c5", stage: "yanit_var", proposed_package: "orta_paket", estimated_value: 55000, next_follow_up: format(today, "yyyy-MM-dd"), created_at: subDays(today, 20).toISOString(), updated_at: subDays(today, 3).toISOString() },
  { id: "d6", company_id: "c6", stage: "yeni", proposed_package: null, estimated_value: null, next_follow_up: format(addDays(today, 5), "yyyy-MM-dd"), created_at: subDays(today, 18).toISOString(), updated_at: subDays(today, 18).toISOString() },
  { id: "d7", company_id: "c7", stage: "mail_atildi", proposed_package: "tam_yeniden_yapim", estimated_value: 95000, next_follow_up: format(addDays(today, 2), "yyyy-MM-dd"), created_at: subDays(today, 15).toISOString(), updated_at: subDays(today, 4).toISOString() },
  { id: "d8", company_id: "c8", stage: "gorusme", proposed_package: "hizli_mudahale", estimated_value: 25000, next_follow_up: format(subDays(today, 1), "yyyy-MM-dd"), created_at: subDays(today, 12).toISOString(), updated_at: subDays(today, 1).toISOString() },
  { id: "d9", company_id: "c9", stage: "kazanildi", proposed_package: "orta_paket", estimated_value: 48000, next_follow_up: null, created_at: subDays(today, 10).toISOString(), updated_at: subDays(today, 6).toISOString() },
  { id: "d10", company_id: "c10", stage: "kaybedildi", proposed_package: "hizli_mudahale", estimated_value: 18000, next_follow_up: null, created_at: subDays(today, 8).toISOString(), updated_at: subDays(today, 7).toISOString() },
];

export const mockContacts: Contact[] = [
  { id: "ct1", company_id: "c1", full_name: "Mehmet Yılmaz", title: "Genel Müdür", email: "mehmet@anadolumakina.com.tr", phone: "+90 532 111 2233", linkedin_url: null, is_primary: true },
  { id: "ct2", company_id: "c2", full_name: "Ayşe Kaya", title: "Pazarlama Müdürü", email: "ayse@deltaplastik.com", phone: "+90 533 222 3344", linkedin_url: "https://linkedin.com/in/aysekaya", is_primary: true },
  { id: "ct3", company_id: "c4", full_name: "Ali Demir", title: "Satış Müdürü", email: "ali@ferhatotomotiv.com", phone: "+90 534 333 4455", linkedin_url: null, is_primary: true },
];

export const mockActivities: Activity[] = [
  { id: "a1", company_id: "c1", deal_id: "d1", type: "mail", note: "Denetim raporu e-postası gönderildi.", created_at: subDays(today, 10).toISOString() },
  { id: "a2", company_id: "c1", deal_id: "d1", type: "arama", note: "Mehmet Bey ile telefon görüşmesi — ilgi var, haftaya toplantı.", created_at: subDays(today, 5).toISOString() },
  { id: "a3", company_id: "c2", deal_id: "d2", type: "mail", note: "İlk tanıtım maili gönderildi.", created_at: subDays(today, 7).toISOString() },
  { id: "a4", company_id: "c5", deal_id: "d5", type: "linkedin", note: "LinkedIn üzerinden bağlantı isteği kabul edildi.", created_at: subDays(today, 4).toISOString() },
];

export function getCompanyById(id: string): Company | undefined {
  return mockCompanies.find((c) => c.id === id);
}

export function getDealByCompanyId(companyId: string): Deal | undefined {
  return mockDeals.find((d) => d.company_id === companyId);
}

export function getContactsByCompanyId(companyId: string): Contact[] {
  return mockContacts.filter((c) => c.company_id === companyId);
}

export function getActivitiesByCompanyId(companyId: string): Activity[] {
  return mockActivities
    .filter((a) => a.company_id === companyId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getCompaniesWithDeals() {
  return mockCompanies.map((company) => ({
    ...company,
    deal: getDealByCompanyId(company.id) ?? null,
  }));
}

export function getSourceBreakdown() {
  const counts: Record<string, number> = {};
  for (const company of mockCompanies) {
    const source = company.source ?? "Diğer";
    counts[source] = (counts[source] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getPipelineBreakdown() {
  const counts: Record<string, number> = {};
  for (const deal of mockDeals) {
    counts[deal.stage] = (counts[deal.stage] ?? 0) + 1;
  }
  return counts;
}

export function getTodayFollowUps() {
  const todayStr = format(today, "yyyy-MM-dd");
  return mockDeals
    .filter((d) => d.next_follow_up && d.next_follow_up <= todayStr)
    .map((deal) => {
      const company = getCompanyById(deal.company_id);
      return { deal, company: company! };
    })
    .filter((item) => item.company);
}

export function getWeekFollowUps() {
  const weekEnd = format(addDays(today, 7), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");
  return mockDeals
    .filter((d) => d.next_follow_up && d.next_follow_up >= todayStr && d.next_follow_up <= weekEnd)
    .map((deal) => {
      const company = getCompanyById(deal.company_id);
      return { deal, company: company! };
    })
    .filter((item) => item.company)
    .sort((a, b) => (a.deal.next_follow_up ?? "").localeCompare(b.deal.next_follow_up ?? ""));
}
