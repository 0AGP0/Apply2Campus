import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PanelLayout } from "@/components/PanelLayout";
import { OfferDetailClient } from "./OfferDetailClient";
import { prisma } from "@/lib/db";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; offerId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId, offerId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
      student: { select: { name: true } },
    },
  });
  if (!offer) notFound();

  const items = offer.items.map((i) => ({
    ...i,
    amount: Number(i.amount),
    startDate: i.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: i.endDate?.toISOString().slice(0, 10) ?? null,
  }));
  const offerForClient = {
    ...offer,
    items,
    sentAt: offer.sentAt?.toISOString() ?? null,
    viewedAt: offer.viewedAt?.toISOString() ?? null,
    respondedAt: offer.respondedAt?.toISOString() ?? null,
    createdAt: offer.createdAt.toISOString(),
  };

  return (
    <PanelLayout
      backHref={`/students/${studentId}`}
      backLabel="Öğrenciye dön"
      title={offer.title}
      subtitle="Teklif detayı"
      sticky
    >
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/students" className="hover:text-primary">Öğrenciler</Link>
          <span className="material-icons-outlined text-xs">chevron_right</span>
          <Link href={`/students/${studentId}`} className="hover:text-primary truncate">{offer.student.name}</Link>
          <span className="material-icons-outlined text-xs">chevron_right</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{offer.title}</span>
        </nav>
        <OfferDetailClient
          studentId={studentId}
          offer={offerForClient}
          isStudent={false}
        />
    </PanelLayout>
  );
}
