import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "CONSULTANT" },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { assignedStudents: true } },
      assignedStudents: { select: { id: true, name: true } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, message: true },
      },
    },
  });
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json({ consultants: users, admins });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, role: newRole } = body;
  const assignRole = newRole === "ADMIN" ? "ADMIN" : "CONSULTANT";
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Email required" }, { status: 400 });
  const trimmedEmail = email.trim().toLowerCase();
  if (assignRole === "CONSULTANT" && (!password || (password as string).length < 6))
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;
  const user = await prisma.user.create({
    data: {
      email: trimmedEmail,
      name: (name ?? trimmedEmail).toString().trim() || null,
      passwordHash,
      role: assignRole,
    },
  });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}
