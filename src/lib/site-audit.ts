import type { AuditStatus } from "@/types";

export type SiteAuditResult = {
  audit_status: AuditStatus;
  findings: string;
  impact: string;
  checks: {
    reachable: boolean;
    statusCode: number | null;
    responseMs: number;
    hasTitle: boolean;
    hasViewport: boolean;
    isHttps: boolean;
  };
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function auditWebsite(rawUrl: string): Promise<SiteAuditResult> {
  const url = normalizeUrl(rawUrl);
  const isHttps = url.startsWith("https://");
  const start = Date.now();

  let statusCode: number | null = null;
  let html = "";
  let reachable = false;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "GenuaCRM-Audit/1.0" },
    });
    statusCode = res.status;
    reachable = res.ok;
    html = await res.text();
  } catch {
    return {
      audit_status: "kritik",
      findings: `Web sitesi erişilemedi: ${url}\nBağlantı zaman aşımı veya DNS/SSL hatası olabilir.`,
      impact: "Potansiyel müşteriler siteye ulaşamıyorsa güven ve dönüşüm kaybı oluşur.",
      checks: {
        reachable: false,
        statusCode,
        responseMs: Date.now() - start,
        hasTitle: false,
        hasViewport: false,
        isHttps,
      },
    };
  }

  const responseMs = Date.now() - start;
  const hasTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);

  const issues: string[] = [];
  if (!isHttps) issues.push("Site HTTPS kullanmıyor (güvenlik ve SEO riski).");
  if (!hasTitle) issues.push("Sayfa başlığı (title) eksik veya okunamıyor.");
  if (!hasViewport) issues.push("Mobil viewport meta etiketi bulunamadı (mobil uyumluluk riski).");
  if (responseMs > 3000) issues.push(`Sayfa yanıt süresi yüksek: ${(responseMs / 1000).toFixed(1)} sn.`);
  if (statusCode && statusCode >= 400) issues.push(`HTTP durum kodu: ${statusCode}.`);

  let audit_status: AuditStatus = "iyi";
  if (!reachable || !isHttps || responseMs > 5000) audit_status = "kritik";
  else if (issues.length > 0) audit_status = "orta";

  const findings =
    issues.length > 0
      ? issues.join("\n")
      : "Temel kontroller geçti: site erişilebilir, HTTPS aktif, title ve mobil viewport mevcut.";

  const impact =
    audit_status === "iyi"
      ? "Site temel teknik kontrollerden geçti; detaylı SEO/performans denetimi için PDF raporu önerilir."
      : audit_status === "orta"
        ? "Orta seviye iyileştirmelerle dönüşüm ve güven artırılabilir."
        : "Kritik teknik sorunlar müşteri kaybına ve marka güvenine zarar verebilir.";

  return {
    audit_status,
    findings,
    impact,
    checks: {
      reachable,
      statusCode,
      responseMs,
      hasTitle,
      hasViewport,
      isHttps,
    },
  };
}
