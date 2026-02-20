import { getServerSession, authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OfferDetailClient } from "@/app/students/[studentId]/offers/[offerId]/OfferDetailClient";

export default async function DashboardOfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const { offerId } = await params;

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true, email: true } },
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">{offer.title}</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Teklif detayı</p>
      <OfferDetailClient
        studentId={studentId}
        offer={offerForClient}
        isStudent={true}
      />
    </div>
  );
}
