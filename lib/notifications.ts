import { prisma } from "@/lib/db";

export type NotificationType = "STUDENT_ASSIGNED" | "STUDENT_UPDATED";

/**
 * Danışmana bildirim oluşturur. consultantId yoksa hiçbir şey yapmaz.
 */
export async function createConsultantNotification(
  consultantId: string,
  type: NotificationType,
  studentId: string,
  message: string | null
): Promise<void> {
  await prisma.consultantNotification.create({
    data: {
      userId: consultantId,
      type,
      studentId,
      message: message ?? null,
    },
  });
}
