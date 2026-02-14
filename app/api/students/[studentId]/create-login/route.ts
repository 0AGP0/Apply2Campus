import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Admin (veya ileride danışman) bir öğrenci için giriş hesabı oluşturur.
 * Body: { email, password } - öğrencinin giriş yapacağı email ve şifre
 */
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
  if (role !== "ADMIN") return NextResponse.json({ error: "Sadece admin öğrenci hesabı oluşturabilir" }, { status: 403 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  const body = await req.json();
  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: "email ve password gerekli" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: String(email).trim() } });
  if (existing) return NextResponse.json({ error: "Bu email ile kayıtlı kullanıcı zaten var" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: String(email).trim(),
      name: student.name,
      passwordHash,
      role: "STUDENT",
      studentId: student.id,
    },
  });
  return NextResponse.json({ ok: true, message: "Öğrenci giriş hesabı oluşturuldu" });
}
