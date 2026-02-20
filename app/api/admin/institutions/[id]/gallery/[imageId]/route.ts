import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";
import { createReadStream, documentExists } from "@/lib/storage";
import { Readable } from "stream";

/** Galeri görselini serve et */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; imageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN" && role !== "CONSULTANT" && !isOperationRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: institutionId, imageId } = await ctx.params;
  const img = await prisma.institutionImage.findFirst({
    where: { id: imageId, institutionId },
  });
  if (!img) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (!documentExists(img.filePath)) return NextResponse.json({ error: "Dosya eksik" }, { status: 404 });

  const ext = img.filePath.split(".").pop() ?? "jpg";
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const nodeStream = createReadStream(img.filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; imageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: institutionId, imageId } = await ctx.params;
  const img = await prisma.institutionImage.findFirst({
    where: { id: imageId, institutionId },
  });
  if (!img) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const fs = await import("fs");
  const path = await import("path");
  const base = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
  const fullPath = path.join(base, img.filePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  await prisma.institutionImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
