import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { getAuthUrl } from "@/lib/gmail";
import { signOAuthState } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;

  let studentId: string;
  if (role === "STUDENT") {
    if (!sessionStudentId) return NextResponse.json({ error: "Student record not linked" }, { status: 400 });
    studentId = sessionStudentId;
  } else {
    studentId = req.nextUrl.searchParams.get("studentId") ?? "";
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
    const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = signOAuthState(studentId);
  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}
