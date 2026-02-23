import { prisma } from "@/lib/db";

export type NotificationType = "STUDENT_ASSIGNED" | "STUDENT_UPDATED";
export type UserNotificationType = "ANNOUNCEMENT" | "OFFER_SENT";

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

/**
 * Duyuru veya teklif bildirimi oluşturur.
 */
export async function createUserNotification(
  userId: string,
  type: UserNotificationType,
  title: string,
  options?: { message?: string; linkHref?: string; relatedId?: string }
): Promise<void> {
  await prisma.userNotification.create({
    data: {
      userId,
      type,
      title,
      message: options?.message ?? null,
      linkHref: options?.linkHref ?? null,
      relatedId: options?.relatedId ?? null,
    },
  });
}

/**
 * Duyuru eklendiğinde hedef kitleye bildirim gönderir.
 * @param targetAudience STUDENTS | CONSULTANTS | ALL
 */
export async function notifyAnnouncementToAll(
  announcementId: string,
  title: string,
  type: string,
  targetAudience: string = "ALL"
): Promise<void> {
  const label = type === "ETKINLIK" ? "Yeni etkinlik" : "Yeni duyuru";

  if (targetAudience === "STUDENTS" || targetAudience === "ALL") {
    const students = await prisma.user.findMany({ where: { studentId: { not: null } }, select: { id: true } });
    for (const u of students) {
      await createUserNotification(u.id, "ANNOUNCEMENT", label, {
        message: title,
        linkHref: "/dashboard/duyurular",
        relatedId: announcementId,
      }).catch(() => {});
    }
  }

  if (targetAudience === "CONSULTANTS" || targetAudience === "ALL") {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["CONSULTANT", "OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA", "ADMIN"] } },
      select: { id: true },
    });
    for (const u of staff) {
      await createUserNotification(u.id, "ANNOUNCEMENT", label, {
        message: title,
        linkHref: "/panel/duyurular",
        relatedId: announcementId,
      }).catch(() => {});
    }
  }
}

/**
 * Teklif gönderildiğinde öğrenciye bildirim gönderir.
 */
export async function notifyOfferSentToStudent(studentId: string, offerId: string, offerTitle: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { studentId } });
  if (!user) return;
  await createUserNotification(user.id, "OFFER_SENT", "Yeni teklif", {
    message: offerTitle,
    linkHref: `/dashboard/offers/${offerId}`,
    relatedId: offerId,
  }).catch(() => {});
}
