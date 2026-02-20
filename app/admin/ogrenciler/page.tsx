import { StudentListClient } from "@/app/students/StudentListClient";
import { PanelLayout } from "@/components/PanelLayout";

type Props = {
  searchParams: Promise<{ consultantId?: string }>;
};

export default async function AdminOgrencilerPage({ searchParams }: Props) {
  const { consultantId } = await searchParams;
  return (
    <PanelLayout
      title="Öğrenciler"
      subtitle="Tüm öğrencileri görüntüleyin, danışman atayın ve düzenleyin"
    >
      <div className="mt-4 sm:mt-6">
        <StudentListClient isAdmin={true} defaultConsultantId={consultantId} />
      </div>
    </PanelLayout>
  );
}
