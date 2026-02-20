import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";
import { saveInstitutionFile, createReadStream, documentExists } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";
import { Readable } from "stream";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Katalog PDF yükle */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: institutionId } = await ctx.params;
  const inst = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!inst) return NextResponse.json({ error: "Kurum bulunamadı" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 20 MB'dan büyük olamaz" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Sadece PDF dosyası yüklenebilir" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "katalog");
  const relativePath = saveInstitutionFile(buffer, institutionId, "catalog", originalName, fileId);

  const oldPath = inst.catalogPdfPath;
  if (oldPath) {
    const fs = await import("fs");
    const path = await import("path");
    const base = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
    const fullPath = path.join(base, oldPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  await prisma.institution.update({
    where: { id: institutionId },
    data: { catalogPdfPath: relativePath },
  });

  return NextResponse.json({
    catalogPdfPath: relativePath,
    fileName: originalName,
  });
}

/** Katalog PDF indir */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN" && role !== "CONSULTANT" && !isOperationRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: institutionId } = await ctx.params;
  const inst = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!inst?.catalogPdfPath) return NextResponse.json({ error: "Katalog bulunamadı" }, { status: 404 });
  if (!documentExists(inst.catalogPdfPath)) return NextResponse.json({ error: "Dosya eksik" }, { status: 404 });

  const nodeStream = createReadStream(inst.catalogPdfPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("katalog.pdf")}`,
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
