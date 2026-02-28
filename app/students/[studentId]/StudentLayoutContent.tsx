"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StudentDetailNav } from "./StudentDetailNav";

export function StudentLayoutContent({
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
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 overflow-x-auto shrink-0">
        <Link href="/students" className="hover:text-primary transition-colors shrink-0">
          Öğrenciler
        </Link>
        <span className="material-icons-outlined text-xs shrink-0">chevron_right</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
          {studentName}
        </span>
      </nav>
      <StudentDetailNav studentId={studentId} />
      <div className="mt-2 min-h-0 flex-1 flex flex-col overflow-hidden">{children}</div>
    </>
  );
}
