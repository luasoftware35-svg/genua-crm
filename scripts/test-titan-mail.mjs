import { readFileSync } from "fs";
import { resolve } from "path";
import nodemailer from "nodemailer";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv();
const user = env.TITAN_SMTP_USER;
const pass = env.TITAN_SMTP_PASS;
const from = env.TITAN_MAIL_FROM ?? user;
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error("TITAN_SMTP_USER ve TITAN_SMTP_PASS .env.local içinde olmalı.");
  process.exit(1);
}

const host = env.TITAN_SMTP_HOST ?? "smtp.titan.email";
const port = Number(env.TITAN_SMTP_PORT ?? "587");
const secure = env.TITAN_SMTP_SECURE === "true" || port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

console.log(`SMTP test: ${host}:${port} → ${to}`);

try {
  await transporter.verify();
  console.log("OK: SMTP bağlantısı doğrulandı");

  await transporter.sendMail({
    from: `"${env.TITAN_MAIL_FROM_NAME ?? "Genua Digital"}" <${from}>`,
    to,
    subject: "Genua CRM — Titan Mail test",
    text: "Bu mesaj Genua CRM Titan Mail entegrasyon testidir.",
  });

  console.log("OK: Test maili gönderildi:", to);
} catch (err) {
  console.error("HATA:", err instanceof Error ? err.message : err);
  console.error("");
  console.error("Kontrol listesi:");
  console.error("- Titan panelinde 3rd party email access açık mı?");
  console.error("- 2FA kapalı mı? (SMTP için gerekli)");
  console.error("- Vercel IP engellenmiş olabilir — support@titan.email");
  process.exit(1);
}
