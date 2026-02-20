import { prisma } from "./db";
import { isOperationRole } from "./roles";

export { isOperationRole } from "./roles";

export async function canAccessStudent(
  userId: string,
  userRole: string,
  studentId: string,
  sessionStudentId?: string | null
): Promise<boolean> {
  if (userRole === "ADMIN" || isOperationRole(userRole)) return true;
  if (userRole === "STUDENT" && sessionStudentId) return sessionStudentId === studentId;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { assignedConsultantId: true },
  });
  return student?.assignedConsultantId === userId;
}

export async function getStudentsForUser(userId: string, role: string, sessionStudentId?: string | null) {
  if (role === "STUDENT" && sessionStudentId) {
    const s = await prisma.student.findUnique({
      where: { id: sessionStudentId },
      include: {
        consultant: { select: { id: true, name: true, email: true } },
        gmailConnection: { select: { status: true, lastSyncAt: true } },
      },
    });
    return s ? [s] : [];
  }
  if (role === "ADMIN" || isOperationRole(role)) {
    return prisma.student.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        consultant: { select: { id: true, name: true, email: true } },
        gmailConnection: { select: { status: true, lastSyncAt: true } },
      },
    });
  }
  return prisma.student.findMany({
    where: { assignedConsultantId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      gmailConnection: { select: { status: true, lastSyncAt: true } },
    },
  });
}
