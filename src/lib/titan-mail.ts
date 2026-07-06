import nodemailer from "nodemailer";

export type TitanMailConfig = {
  configured: boolean;
  from: string;
  fromName: string;
  host: string;
  port: number;
};

export function getTitanMailConfig(): TitanMailConfig {
  const from = process.env.TITAN_MAIL_FROM ?? process.env.TITAN_SMTP_USER ?? "";
  const fromName = process.env.TITAN_MAIL_FROM_NAME ?? "Genua Digital";
  const host = process.env.TITAN_SMTP_HOST ?? "smtpout.secureserver.net";
  const port = Number(process.env.TITAN_SMTP_PORT ?? "465");

  return {
    configured: Boolean(process.env.TITAN_SMTP_USER && process.env.TITAN_SMTP_PASS && from),
    from,
    fromName,
    host,
    port,
  };
}

function createTransporter() {
  const config = getTitanMailConfig();
  if (!config.configured) {
    throw new Error("Titan Mail yapılandırılmamış. TITAN_SMTP_USER ve TITAN_SMTP_PASS gerekli.");
  }

  const secure =
    process.env.TITAN_SMTP_SECURE === "true" || config.port === 465;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: process.env.TITAN_SMTP_USER!,
      pass: process.env.TITAN_SMTP_PASS!,
    },
  });
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendTitanMail(input: SendMailInput): Promise<void> {
  const config = getTitanMailConfig();
  const transporter = createTransporter();
  const replyTo = input.replyTo ?? process.env.TITAN_MAIL_REPLY_TO ?? config.from;

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.from}>`,
    to: input.to,
    replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br/>"),
  });
}

export async function verifyTitanConnection(): Promise<void> {
  const transporter = createTransporter();
  await transporter.verify();
}
