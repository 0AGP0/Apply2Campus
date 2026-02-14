"use client";

/** Uygulama sarmalayıcı. Session sunucu tarafında getServerSession ile alındığı için client SessionProvider gerekmiyor. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
