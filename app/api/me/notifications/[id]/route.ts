import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Bildirimi okundu işaretle */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const n = await prisma.userNotification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!n) return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 });

  await prisma.userNotification.update({
    where: { id },
    data: { readAt: n.readAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}
