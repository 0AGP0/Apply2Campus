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
      <div className="flex flex-col min-h-full w-full px-4 sm:px-6 py-2">
        <Link
          href={`/students/${studentId}`}
          className="shrink-0 flex items-center gap-2 py-2 -mt-1 -mx-1 text-sm text-slate-500 hover:text-primary transition-colors w-fit"
          aria-label="Öğrenci detayına dön"
        >
          <span className="material-icons-outlined text-lg">arrow_back</span>
          {studentName}
        </Link>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden mt-1">
          {children}
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
