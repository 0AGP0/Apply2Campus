import { google } from "googleapis";
import { decrypt, encrypt } from "./encryption";
import { prisma } from "./db";
import type { GmailConnection } from "@prisma/client";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/oauth/gmail/callback`
    : "http://localhost:3000/api/oauth/gmail/callback";
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state: string): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function getGmailClientForStudent(studentId: string) {
  const conn = await prisma.gmailConnection.findUnique({
    where: { studentId },
  });
  if (!conn || conn.status === "disconnected" || !conn.refreshTokenEncrypted)
    return null;

  const oauth2 = getOAuth2Client();
  let accessToken = conn.accessTokenEncrypted
    ? decrypt(conn.accessTokenEncrypted)
    : null;
  const refreshToken = decrypt(conn.refreshTokenEncrypted);
  const expiry = conn.expiryDate?.getTime() ?? 0;
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;

  if (!accessToken || expiry < now + bufferMs) {
    oauth2.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2.refreshAccessToken();
    accessToken = credentials.access_token!;
    const newExpiry = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(now + 3600 * 1000);
    await prisma.gmailConnection.update({
      where: { studentId },
      data: {
        accessTokenEncrypted: encrypt(accessToken),
        expiryDate: newExpiry,
        status: "connected",
      },
    });
  }

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  return gmail;
}

export async function syncStudentInbox(studentId: string, maxResults = 50) {
  const gmail = await getGmailClientForStudent(studentId);
  if (!gmail) return { synced: 0, error: "No valid connection" };

  const [inboxList, sentList] = await Promise.all([
    gmail.users.messages.list({ userId: "me", maxResults, labelIds: ["INBOX"] }),
    gmail.users.messages.list({ userId: "me", maxResults, labelIds: ["SENT"] }),
  ]);
  const seen = new Set<string>();
  const messages: { id: string }[] = [];
  for (const m of inboxList.data.messages ?? []) {
    if (m.id && !seen.has(m.id)) {
      seen.add(m.id);
      messages.push({ id: m.id });
    }
  }
  for (const m of sentList.data.messages ?? []) {
    if (m.id && !seen.has(m.id)) {
      seen.add(m.id);
      messages.push({ id: m.id });
    }
  }
  let synced = 0;

  for (const m of messages) {
    if (!m.id) continue;
    const full = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
      format: "full",
    });
    const msg = full.data;
    const payload = msg.payload;
    const headers = payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
    const from = getHeader("From");
    const to = getHeader("To");
    const cc = getHeader("Cc");
    const subject = getHeader("Subject");
    const dateStr = getHeader("Date");
    let bodyHtml: string | null = null;
    if (payload?.body?.data) {
      bodyHtml = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      for (const p of payload.parts) {
        if (p.mimeType === "text/html" && p.body?.data) {
          bodyHtml = Buffer.from(p.body.data, "base64").toString("utf-8");
          break;
        }
      }
    }
    const internalDate = msg.internalDate ? new Date(Number(msg.internalDate)) : new Date();

    await prisma.emailMessage.upsert({
      where: {
        studentId_gmailMessageId: { studentId, gmailMessageId: m.id! },
      },
      create: {
        studentId,
        gmailMessageId: m.id,
        threadId: msg.threadId ?? "",
        from,
        to,
        cc,
        subject,
        snippet: msg.snippet ?? undefined,
        bodyHtml,
        internalDate,
        labels: msg.labelIds ? JSON.stringify(msg.labelIds) : undefined,
      },
      update: {
        snippet: msg.snippet ?? undefined,
        bodyHtml,
        labels: msg.labelIds ? JSON.stringify(msg.labelIds) : undefined,
      },
    });
    synced++;
  }

  await prisma.gmailConnection.update({
    where: { studentId },
    data: { lastSyncAt: new Date() },
  });
  return { synced };
}

export type EmailAttachment = {
  name: string;
  mimeType: string;
  contentBase64: string;
};

export async function sendEmailAsStudent(
  studentId: string,
  to: string,
  subject: string,
  body: string,
  options?: { cc?: string; bcc?: string; attachments?: EmailAttachment[] }
) {
  const gmail = await getGmailClientForStudent(studentId);
  if (!gmail) throw new Error("No valid Gmail connection for this student");

  const bodyContent = typeof body === "string" && body.length > 0 ? body : "<p></p>";
  const attachments = options?.attachments?.filter(
    (a) => a?.name && a?.contentBase64
  ) ?? [];

  let raw: string;

  if (attachments.length === 0) {
    // Tek parça: sadece HTML gövde
    const bodyBase64 = Buffer.from(bodyContent, "utf-8").toString("base64");
    const bodyBase64Lines = bodyBase64.match(/.{1,76}/g) ?? [];
    const headerLines = [
      `To: ${to}`,
      options?.cc ? `Cc: ${options.cc}` : "",
      options?.bcc ? `Bcc: ${options.bcc}` : "",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
    ].filter(Boolean);
    raw = headerLines.join("\r\n") + "\r\n\r\n" + bodyBase64Lines.join("\r\n") + "\r\n";
  } else {
    // Multipart: gövde + ekler
    const boundary = "----=_Part_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const headerLines = [
      `To: ${to}`,
      options?.cc ? `Cc: ${options.cc}` : "",
      options?.bcc ? `Bcc: ${options.bcc}` : "",
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      `Subject: ${subject}`,
    ].filter(Boolean);
    const parts: string[] = [];
    // Parça 1: HTML gövde
    const bodyBase64 = Buffer.from(bodyContent, "utf-8").toString("base64");
    const bodyLines = bodyBase64.match(/.{1,76}/g) ?? [];
    parts.push(
      `--${boundary}\r\n` +
      "Content-Type: text/html; charset=utf-8\r\n" +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      bodyLines.join("\r\n") + "\r\n"
    );
    // Parça 2+: ekler
    for (const a of attachments) {
      const lines = a.contentBase64.match(/.{1,76}/g) ?? [a.contentBase64];
      const safeName = a.name.replace(/[\r\n"]/g, "_");
      parts.push(
        `--${boundary}\r\n` +
        `Content-Type: ${a.mimeType}; name="${safeName}"\r\n` +
        "Content-Transfer-Encoding: base64\r\n" +
        `Content-Disposition: attachment; filename="${safeName}"\r\n\r\n` +
        lines.join("\r\n") + "\r\n"
      );
    }
    parts.push(`--${boundary}--\r\n`);
    raw = headerLines.join("\r\n") + "\r\n\r\n" + parts.join("");
  }

  const encoded = Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sent = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
  return sent.data;
}

export async function getThread(studentId: string, threadId: string) {
  const gmail = await getGmailClientForStudent(studentId);
  if (!gmail) return null;
  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });
  return res.data;
}

export type MessageAttachmentMeta = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
};

/** Mesajdaki eklerin listesini döndürür (metadata). */
export async function getMessageAttachments(
  studentId: string,
  gmailMessageId: string
): Promise<MessageAttachmentMeta[]> {
  const gmail = await getGmailClientForStudent(studentId);
  if (!gmail) return [];
  const res = await gmail.users.messages.get({
    userId: "me",
    id: gmailMessageId,
    format: "full",
  });
  const payload = res.data.payload;
  if (!payload?.parts) return [];
  const out: MessageAttachmentMeta[] = [];
  for (const p of payload.parts) {
    const filename = p.filename?.trim();
    const attachmentId = p.body?.attachmentId;
    if (!filename || !attachmentId) continue;
    out.push({
      filename,
      mimeType: p.mimeType ?? "application/octet-stream",
      size: p.body?.size ?? 0,
      attachmentId,
    });
  }
  return out;
}

/** Tek bir eki indirir (base64url → buffer). */
export async function getAttachment(
  studentId: string,
  gmailMessageId: string,
  attachmentId: string
): Promise<{ data: Buffer; mimeType?: string } | null> {
  const gmail = await getGmailClientForStudent(studentId);
  if (!gmail) return null;
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId: gmailMessageId,
    id: attachmentId,
  });
  const data = res.data.data;
  if (!data) return null;
  const raw = Buffer.from(data, "base64url");
  return { data: raw, mimeType: undefined };
}

export { SCOPES };
