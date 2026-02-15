import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { getAttachment, getMessageAttachments } from "@/lib/gmail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; messageId: string; attachmentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, messageId, attachmentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const metaList = await getMessageAttachments(studentId, messageId).catch(() => []);
  const meta = metaList.find((a) => a.attachmentId === attachmentId);
  const filename = meta?.filename ?? req.nextUrl.searchParams.get("filename") ?? "ek";

  const result = await getAttachment(studentId, messageId, attachmentId);
  if (!result) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
  const body = Buffer.isBuffer(result.data) ? new Uint8Array(result.data) : result.data;
  return new NextResponse(body, {
    headers: {
      "Content-Disposition": disposition,
      "Content-Type": meta?.mimeType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
