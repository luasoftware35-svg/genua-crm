import { promises as dns } from "dns";

export type MailDomainCheck = {
  ok: boolean;
  domain: string;
  reason?: string;
};

export function getEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

/** Alıcı domain'inin MX kaydı var mı kontrol eder */
export async function checkRecipientMailDomain(email: string): Promise<MailDomainCheck> {
  const domain = getEmailDomain(email);
  if (!domain) {
    return { ok: false, domain: "", reason: "Geçersiz e-posta formatı" };
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (!mx.length) {
      return {
        ok: false,
        domain,
        reason: `${domain} için mail sunucusu (MX) kaydı bulunamadı`,
      };
    }
    return { ok: true, domain };
  } catch (err) {
    const code = err instanceof Error && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return {
        ok: false,
        domain,
        reason: `${domain} alan adı bulunamadı veya mail sunucusu tanımlı değil (DNS hatası)`,
      };
    }
    return {
      ok: false,
      domain,
      reason: `${domain} DNS kontrolü başarısız`,
    };
  }
}
