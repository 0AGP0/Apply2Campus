"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLayout } from "@/components/PanelLayout";
import { StudentLayoutContent } from "./StudentLayoutContent";

export function StudentDetailLayoutClient({
  studentId,
  studentName,
  children,
}: {
  studentId: string;
  studentName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isInbox = pathname.includes(`/students/${studentId}/inbox`);

  if (isInbox) {
    return (
      <div className="panel-layout flex flex-col min-h-screen">
        <div className="overflow-y-auto flex-1 min-h-0 flex flex-col">
          <Link
            href={`/students/${studentId}`}
            className="shrink-0 flex items-center gap-2 py-2 text-sm text-slate-500 hover:text-primary transition-colors"
            aria-label="Öğrenci detayına dön"
          >
            <span className="material-icons-outlined text-lg">arrow_back</span>
            {studentName}
          </Link>
          <div className="flex-1 min-h-screen flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PanelLayout
      backHref="/students"
      backLabel="Öğrenci listesine dön"
      title={studentName}
      subtitle="Öğrenci detayı"
      sticky
    >
      <StudentLayoutContent studentId={studentId} studentName={studentName}>
        {children}
      </StudentLayoutContent>
    </PanelLayout>
  );
}
