"use client";

import { useState } from "react";

export function DisconnectButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Gmail bağlantısını kaldırmak istediğinize emin misiniz? Danışmanınız da erişimi kaybeder.")) return;
    setLoading(true);
    await fetch(`/api/students/${studentId}/disconnect`, { method: "POST" });
    setLoading(false);
    window.location.reload();
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="text-red-600 dark:text-red-400 text-sm hover:underline disabled:opacity-50"
    >
      {loading ? "Kaldırılıyor..." : "Gmail bağlantısını kaldır"}
    </button>
  );
}
