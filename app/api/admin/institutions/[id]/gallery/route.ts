import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveInstitutionFile } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 5 MB'dan büyük olamaz" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Sadece JPEG, PNG veya WebP" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "gorsel");
  const relativePath = saveInstitutionFile(buffer, institutionId, "gallery", originalName, fileId);

  const count = await prisma.institutionImage.count({ where: { institutionId } });
  const img = await prisma.institutionImage.create({
    data: {
      institutionId,
      filePath: relativePath,
      sortOrder: count,
    },
  });

  return NextResponse.json({
    id: img.id,
    filePath: img.filePath,
    sortOrder: img.sortOrder,
  });
}
