import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Admin: Kullanıcı siler. Danışman ise önce atanan öğrencilerin ataması kaldırılır. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  if (userId === session.user.id) return NextResponse.json({ error: "Kendinizi silemezsiniz" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  if (user.role === "ADMIN") return NextResponse.json({ error: "Admin kullanıcı silinemez" }, { status: 400 });

  if (user.role === "CONSULTANT") {
    await prisma.student.updateMany({
      where: { assignedConsultantId: userId },
      data: { assignedConsultantId: null },
    });
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
