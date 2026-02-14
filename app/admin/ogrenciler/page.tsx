import { StudentListClient } from "@/app/students/StudentListClient";
import { PageHeader } from "@/components/PageHeader";

type Props = {
  searchParams: Promise<{ consultantId?: string }>;
};

export default async function AdminOgrencilerPage({ searchParams }: Props) {
  const { consultantId } = await searchParams;
  return (
    <div className="panel-page">
      <PageHeader
        title="Öğrenciler"
        subtitle="Tüm öğrencileri görüntüleyin, danışman atayın ve düzenleyin"
      />
      <div className="mt-4 sm:mt-8">
        <StudentListClient isAdmin={true} defaultConsultantId={consultantId} />
      </div>
    </div>
  );
}
