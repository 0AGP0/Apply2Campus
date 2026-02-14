import Link from "next/link";
import { DisconnectButton } from "./DisconnectButton";

type Props = {
  studentId: string;
  gmailAddress: string | null;
  status: string;
  lastSyncAt: Date | null;
  showInboxLink?: boolean;
};

export function GmailConnectionCard({
  studentId,
  gmailAddress,
  status,
  lastSyncAt,
  showInboxLink = false,
}: Props) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Gmail Bağlantısı
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          {status === "connected" && (
            <>
              <p className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Gmail bağlı
              </p>
              {gmailAddress && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {gmailAddress}
                </p>
              )}
              {lastSyncAt && (
                <p className="text-slate-500 text-xs mt-1">
                  Son senkron: {new Date(lastSyncAt).toLocaleString()}
                </p>
              )}
            </>
          )}
          {status === "expired" && (
            <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Bağlantı süresi doldu. Yeniden bağlanmalısın.
            </p>
          )}
          {status === "disconnected" && (
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Gmail henüz bağlı değil. Maillerini görmek için Google ile bağlan.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {status === "connected" && (
            <>
              {showInboxLink && (
                <Link
                  href="/dashboard/inbox"
                  className="bg-primary text-white px-6 py-3 rounded-xl font-medium text-center hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <span className="material-icons-outlined text-lg">inbox</span>
                  Maillerimi Görüntüle
                </Link>
              )}
              <DisconnectButton studentId={studentId} />
            </>
          )}
          {(status === "expired" || status === "disconnected") && (
            <a
              href="/api/oauth/gmail/start"
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium text-center hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span className="material-icons-outlined text-lg">link</span>
              Gmail ile Bağlan
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
