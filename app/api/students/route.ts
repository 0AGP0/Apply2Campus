
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { getStudentsForUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const students = await getStudentsForUser(session.user.id, role, sessionStudentId);

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const stage = req.nextUrl.searchParams.get("stage") ?? "";
  const gmailStatus = req.nextUrl.searchParams.get("gmailStatus") ?? "";
  const consultantId = req.nextUrl.searchParams.get("consultantId") ?? "";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(250, Math.max(10, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "50", 10)));

  let filtered = students;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentEmail?.toLowerCase().includes(q) ||
        s.gmailAddress?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }
  if (stage) filtered = filtered.filter((s) => s.stage === stage);
  if (gmailStatus) {
    filtered = filtered.filter((s) => {
      const status = s.gmailConnection?.status ?? "disconnected";
      return status === gmailStatus;
    });
  }
  if (consultantId && role === "ADMIN")
    filtered = filtered.filter((s) => s.assignedConsultantId === consultantId);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    students: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, studentEmail, gmailAddress, stage, assignedConsultantId } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const stageSlug = stage ?? "lead";
  const stages = await prisma.stage.findMany({ select: { slug: true } });
  const validSlugs = stages.map((s) => s.slug);
  const finalStage = validSlugs.includes(stageSlug) ? stageSlug : validSlugs[0] ?? "lead";

  const student = await prisma.student.create({
    data: {
      name,
      studentEmail: studentEmail ?? null,
      gmailAddress: gmailAddress ?? null,
      stage: finalStage,
      assignedConsultantId: assignedConsultantId ?? null,
    },
  });
  return NextResponse.json(student);
}
