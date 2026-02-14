import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;
  if (!name || !email || !password || typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const student = await prisma.student.create({
    data: {
      name: name.trim(),
      studentEmail: trimmedEmail,
      stage: "lead",
    },
  });
  await prisma.user.create({
    data: {
      email: trimmedEmail,
      name: name.trim(),
      passwordHash,
      role: "STUDENT",
      studentId: student.id,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
