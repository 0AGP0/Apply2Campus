import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { sendEmailAsStudent } from "@/lib/gmail";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await req.json();
  const {
    to,
    subject,
    html,
    body: bodyHtml,
    bodyHtml: bodyHtmlAlt,
    message,
    text,
    cc,
    bcc,
    attachments,
  } = payload;
  const htmlBody =
    html ?? bodyHtml ?? bodyHtmlAlt ?? message ?? text ?? "";
  const bodyStr = typeof htmlBody === "string" ? htmlBody : "";
  const attachmentList = Array.isArray(attachments)
    ? attachments
        .filter((a: unknown) => a && typeof a === "object" && "name" in a && "contentBase64" in a)
        .map((a: { name: string; mimeType?: string; contentBase64: string }) => ({
          name: String(a.name),
          mimeType: typeof a.mimeType === "string" ? a.mimeType : "application/octet-stream",
          contentBase64: String(a.contentBase64),
        }))
    : [];
  if (!to || !subject) {
    return NextResponse.json({ error: "to and subject required" }, { status: 400 });
  }

  try {
    const sent = await sendEmailAsStudent(
      studentId,
      to,
      subject,
      bodyStr,
      { cc, bcc, attachments: attachmentList }
    );
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        studentId,
        type: "send_email",
        message: `Sent to ${to}`,
        level: "info",
      },
    });
    return NextResponse.json({ id: sent.id });
  } catch (e) {
    console.error("Send error:", e);
    return NextResponse.json(
      { error: "Send failed. Check Gmail connection." },
      { status: 500 }
    );
  }
}
