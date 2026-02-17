import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";

/** Öğrencinin kendi portal giriş bilgileri (ad, giriş e-postası). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || !studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { name: true, studentLogin: { select: { email: true } } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: student.name,
    loginEmail: student.studentLogin?.email ?? null,
  });
}

/** Öğrenci kendi portal giriş bilgilerini günceller: ad, giriş e-postası, şifre (opsiyonel). */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || !studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { name, loginEmail, newPassword } = body as { name?: string; loginEmail?: string; newPassword?: string };

  const loginUser = await prisma.user.findFirst({
    where: { studentId, role: "STUDENT" },
    select: { id: true, email: true },
  });
  if (!loginUser) return NextResponse.json({ error: "Giriş hesabı bulunamadı" }, { status: 404 });

  const updates: { student?: { name: string }; user?: { email?: string; passwordHash?: string } } = {};

  if (name !== undefined && String(name).trim()) {
    updates.student = { name: String(name).trim() };
  }
  if (loginEmail !== undefined) {
    const email = String(loginEmail).trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Giriş e-postası boş olamaz" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== loginUser.id) return NextResponse.json({ error: "Bu e-posta adresi zaten kullanılıyor" }, { status: 400 });
    updates.user = { ...updates.user, email };
  }
  if (newPassword !== undefined && newPassword !== "") {
    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.ok) return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    updates.user = { ...updates.user, passwordHash };
  }

  if (updates.student) {
    await prisma.student.update({
      where: { id: studentId },
      data: updates.student,
    });
  }
  if (updates.user && Object.keys(updates.user).length > 0) {
    await prisma.user.update({
      where: { id: loginUser.id },
      data: updates.user,
    });
  }

  return NextResponse.json({ ok: true });
}
