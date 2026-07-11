import { ImapFlow } from "imapflow";
// MailComposer is not exported from nodemailer main entry.
import MailComposer from "nodemailer/lib/mail-composer";

type MailComposerOptions = ConstructorParameters<typeof MailComposer>[0];

const SENT_FOLDER_CANDIDATES = [
  "Sent",
  "Sent Items",
  "INBOX.Sent",
  "Sent Mail",
  "Gönderilmiş",
  "Gönderilen",
];

function shouldSaveToSent(): boolean {
  return process.env.TITAN_MAIL_SAVE_TO_SENT !== "false";
}

function shouldBccSelf(): boolean {
  return process.env.TITAN_MAIL_BCC_SELF !== "false";
}

export function getBccSelfAddress(from: string): string | undefined {
  if (!shouldBccSelf()) return undefined;
  return process.env.TITAN_MAIL_BCC ?? from;
}

function buildRawMessage(options: MailComposerOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mail = new MailComposer(options).compile();
    mail.build((err: Error | null, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });
}

async function appendToSentFolder(rawMessage: Buffer): Promise<void> {
  const user = process.env.TITAN_SMTP_USER;
  const pass = process.env.TITAN_SMTP_PASS;
  if (!user || !pass) return;

  const host = process.env.TITAN_IMAP_HOST ?? "imap.secureserver.net";
  const port = Number(process.env.TITAN_IMAP_PORT ?? "993");

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();

  try {
    for (const folder of SENT_FOLDER_CANDIDATES) {
      try {
        const lock = await client.getMailboxLock(folder);
        try {
          await client.append(folder, rawMessage, ["\\Seen"]);
          return;
        } finally {
          lock.release();
        }
      } catch {
        continue;
      }
    }

    console.warn("Titan Sent klasörüne yazılamadı — bilinen klasör adları denendi.");
  } finally {
    await client.logout();
  }
}

export async function archiveOutboundMail(options: MailComposerOptions): Promise<void> {
  if (!shouldSaveToSent()) return;

  try {
    const rawMessage = await buildRawMessage(options);
    await appendToSentFolder(rawMessage);
  } catch (err) {
    console.warn(
      "Gönderilen kutusuna kayıt başarısız (mail yine de gönderildi):",
      err instanceof Error ? err.message : err
    );
  }
}
