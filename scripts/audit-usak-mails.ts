import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { promises as dns } from "dns";
import { parseMailMetinleri } from "../src/lib/mail-metinleri";

const SOURCE =
  process.argv[2] ??
  "/Users/umutcanavci/Desktop/Cloud - Gönder/Uşak Osb - 10 Firma/mail_metinleri.md";

const PDFS = [
  "01_AVS_Iplik_Tekstil.pdf",
  "02_Agreton.pdf",
  "03_Alkar_Atlas.pdf",
  "04_Alperteks_Mensucat.pdf",
  "05_Altinkoza_Tekstil.pdf",
  "06_Altinsar_Tekstil.pdf",
  "07_Altuner_Musamba.pdf",
  "08_Arslan_Elektrik_Kablo.pdf",
  "09_Billur_Tekstil.pdf",
  "10_Aselmop_Asl_Iplik.pdf",
];

async function mxStatus(domain: string) {
  try {
    const mx = await dns.resolveMx(domain);
    if (!mx.length) return { ok: false, detail: "MX yok" };
    const best = [...mx].sort((a, b) => a.priority - b.priority)[0];
    return { ok: true, detail: best.exchange };
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? String((err as NodeJS.ErrnoException).code)
        : "FAIL";
    return { ok: false, detail: code };
  }
}

async function main() {
  const md = readFileSync(resolve(SOURCE), "utf8");
  const mails = parseMailMetinleri(md);

  console.log("Dosya:", SOURCE);
  console.log("");
  console.log(
    [
      "#".padEnd(3),
      "Firma".padEnd(42),
      "Dosyadaki e-posta".padEnd(30),
      "DNS".padEnd(8),
      "Durum",
    ].join(" ")
  );
  console.log("-".repeat(110));

  const risky: typeof mails = [];

  for (const mail of mails) {
    const domain = mail.to.split("@")[1]?.toLowerCase() ?? "";
    const mx = await mxStatus(domain);
    const status = mx.ok ? `✓ ${mx.detail}` : `✗ ${mx.detail}`;
    console.log(
      [
        String(mail.index).padEnd(3),
        mail.companyName.slice(0, 40).padEnd(42),
        mail.to.padEnd(30),
        domain.slice(0, 24).padEnd(8),
        status,
      ].join(" ")
    );
    if (!mx.ok) risky.push(mail);
  }

  console.log("");
  console.log(`Toplam: ${mails.length} firma · Riskli: ${risky.length}`);

  if (risky.length) {
    console.log("");
    console.log("GÖNDERİLMEMELİ (dosyadaki adres DNS'te yok):");
    for (const mail of risky) {
      const pdf = PDFS[mail.index - 1];
      console.log(`  ${mail.index}. ${mail.companyName}`);
      console.log(`     E-posta: ${mail.to}`);
      console.log(`     PDF: ${pdf}`);
    }
  }

  const jsonPath = resolve(process.cwd(), "data/usak-osb/mail-templates.json");
  const templates: Record<
    string,
    {
      companyName: string;
      to: string;
      subject: string;
      body: string;
      pdfPath: string;
      dnsOk: boolean;
    }
  > = {};

  for (const mail of mails) {
    const pdf = PDFS[mail.index - 1];
    const domain = mail.to.split("@")[1]?.toLowerCase() ?? "";
    const mx = await mxStatus(domain);
    templates[pdf] = {
      companyName: mail.companyName,
      to: mail.to,
      subject: mail.subject,
      body: mail.body,
      pdfPath: `/audits/usak-osb/${pdf}`,
      dnsOk: mx.ok,
    };
  }

  writeFileSync(jsonPath, JSON.stringify(templates, null, 2));
  console.log("");
  console.log("Güncellendi:", jsonPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
