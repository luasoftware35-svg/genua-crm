import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { getSignatureImagePath, SIGNATURE_CID } from "@/lib/mail-signature";
import { archiveOutboundMail, getBccSelfAddress } from "@/lib/titan-sent";

export type TitanMailConfig = {
  configured: boolean;
  from: string;
  fromName: string;
  host: string;
  port: number;
};

export const TITAN_FROM_NAME = "Genua Digital";

export function getTitanMailConfig(): TitanMailConfig {
  const from = process.env.TITAN_MAIL_FROM ?? process.env.TITAN_SMTP_USER ?? "";
  const host = process.env.TITAN_SMTP_HOST ?? "smtpout.secureserver.net";
  const port = Number(process.env.TITAN_SMTP_PORT ?? "465");

  return {
    configured: Boolean(process.env.TITAN_SMTP_USER && process.env.TITAN_SMTP_PASS && from),
    from,
    fromName: TITAN_FROM_NAME,
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
  attachments?: Array<{
    filename: string;
    path: string;
    cid?: string;
  }>;
};

function getSignatureAttachment() {
  const imagePath = getSignatureImagePath();
  if (!fs.existsSync(imagePath)) return null;

  return {
    filename: "genua-signature.png",
    path: imagePath,
    cid: SIGNATURE_CID,
  };
}

export function resolvePublicAttachment(publicPath: string): { filename: string; path: string } | null {
  const cleaned = publicPath.replace(/^\/+/, "");
  const absolute = path.join(process.cwd(), "public", cleaned);
  if (!fs.existsSync(absolute)) return null;
  return {
    filename: path.basename(absolute),
    path: absolute,
  };
}

export async function sendTitanMail(input: SendMailInput): Promise<void> {
  const config = getTitanMailConfig();
  const transporter = createTransporter();
  const replyTo = input.replyTo ?? process.env.TITAN_MAIL_REPLY_TO ?? config.from;
  const signatureAttachment = getSignatureAttachment();
  const attachments = [...(input.attachments ?? [])];
  if (signatureAttachment) attachments.push(signatureAttachment);

  const mailOptions = {
    from: `"${TITAN_FROM_NAME}" <${config.from}>`,
    to: input.to,
    bcc: getBccSelfAddress(config.from),
    replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br/>"),
    attachments: attachments.length ? attachments : undefined,
  };

  await transporter.sendMail(mailOptions);
  await archiveOutboundMail(mailOptions);
}

export async function verifyTitanConnection(): Promise<void> {
  const transporter = createTransporter();
  await transporter.verify();
}
