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

process.env.TITAN_SMTP_USER = user;
process.env.TITAN_SMTP_PASS = pass;
process.env.TITAN_MAIL_FROM = from;
process.env.TITAN_SMTP_HOST = env.TITAN_SMTP_HOST ?? "smtpout.secureserver.net";
process.env.TITAN_SMTP_PORT = env.TITAN_SMTP_PORT ?? "465";
process.env.TITAN_SMTP_SECURE = env.TITAN_SMTP_SECURE ?? "true";

const { sendTitanMail } = await import("../src/lib/titan-mail.ts");

console.log(`Gönderim + Titan Sent test → ${to}`);

try {
  await sendTitanMail({
    to,
    subject: "Genua CRM — Titan Sent klasörü testi",
    text: "Bu test maili CRM üzerinden gönderildi. Titan Gönderilenler klasöründe görünmeli.",
    html: "<p>Bu test maili CRM üzerinden gönderildi. <strong>Titan Gönderilenler</strong> klasöründe görünmeli.</p>",
  });
  console.log("OK: Mail gönderildi ve Sent klasörüne yazılmaya çalışıldı.");
  console.log("Titan uygulamasında Gönderilenler'i kontrol edin.");
} catch (err) {
  console.error("HATA:", err instanceof Error ? err.message : err);
  process.exit(1);
}
