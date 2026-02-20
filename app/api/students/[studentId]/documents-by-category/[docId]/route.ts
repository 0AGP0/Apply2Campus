import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createReadStream, documentExists } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";
import { Readable } from "stream";

const ALLOWED_STATUSES = ["UPLOADED", "APPROVED", "REVISION_REQUESTED"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, docId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await prisma.studentDocumentByCategory.findFirst({
    where: { id: docId, studentId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!documentExists(doc.filePath)) return NextResponse.json({ error: "File missing" }, { status: 404 });

  const filename = safeFilename(doc.fileName, "belge");
  const nodeStream = createReadStream(doc.filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, docId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "STUDENT") return NextResponse.json({ error: "Öğrenci belge durumu güncelleyemez" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!status || typeof status !== "string" || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "Geçerli status gerekli" }, { status: 400 });
  }

  const doc = await prisma.studentDocumentByCategory.findFirst({
    where: { id: docId, studentId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.studentDocumentByCategory.update({
    where: { id: docId },
    data: { status: status as "UPLOADED" | "APPROVED" | "REVISION_REQUESTED" },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
