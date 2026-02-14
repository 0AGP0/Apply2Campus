"use client";

import { useState, useRef } from "react";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_MB = 10;

export function ComposeModal({
  studentId,
  gmailAddress,
  onClose,
  onSent,
  initialTo,
  initialSubject,
}: {
  studentId: string;
  gmailAddress: string;
  onClose: () => void;
  onSent: () => void;
  initialTo?: string;
  initialSubject?: string;
}) {
  const [to, setTo] = useState(initialTo ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const valid = chosen.filter((f) => f.size <= maxBytes);
    if (valid.length < chosen.length) {
      alert(`En fazla ${MAX_FILE_SIZE_MB} MB dosya yükleyebilirsiniz. Daha büyük dosyalar atlandı.`);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_ATTACHMENTS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function fileToBase64(file: File): Promise<{ name: string; mimeType: string; contentBase64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        if (!base64) reject(new Error("Okuma hatası"));
        else resolve({ name: file.name, mimeType: file.type || "application/octet-stream", contentBase64: base64 });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleSend() {
    if (!to.trim()) {
      alert("En az bir alıcı girin.");
      return;
    }
    const messageHtml = body.trim()
      ? `<p>${body.replace(/\n/g, "</p><p>")}</p>`
      : "<p></p>";
    setSending(true);
    try {
      const attachments = await Promise.all(files.map(fileToBase64));
      const res = await fetch(`/api/students/${studentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim() || "(No subject)",
          html: messageHtml,
          ...(cc.trim() && { cc: cc.trim() }),
          ...(bcc.trim() && { bcc: bcc.trim() }),
          ...(attachments.length > 0 && { attachments }),
        }),
      });
      if (res.ok) onSent();
      else {
        const data = await res.json();
        alert(data.error ?? "Gönderilemedi");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Yeni mesaj</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded text-slate-500 transition-colors"
          >
            <span className="material-icons-outlined text-xl">close</span>
          </button>
        </div>
        <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm font-medium text-slate-400 w-8">Kime</span>
            <input
              className="flex-1 border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-slate-200"
              placeholder="Alıcılar"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 py-2 border-t border-slate-50 dark:border-slate-800/50">
            <span className="text-sm font-medium text-slate-400 w-8">Cc</span>
            <input
              className="flex-1 border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-slate-200"
              placeholder="Cc (isteğe bağlı)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 py-2 border-t border-slate-50 dark:border-slate-800/50">
            <span className="text-sm font-medium text-slate-400 w-8">Bcc</span>
            <input
              className="flex-1 border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-slate-200"
              placeholder="Bcc (isteğe bağlı)"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <input
            className="w-full border-none focus:ring-0 p-0 text-base font-medium text-slate-800 dark:text-slate-100 bg-transparent placeholder:text-slate-400"
            placeholder="Konu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        {files.length > 0 && (
          <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0 flex flex-wrap items-center gap-2">
            {files.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
              >
                <span className="material-icons-outlined text-base">attach_file</span>
                <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  aria-label="Kaldır"
                >
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="*/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= MAX_ATTACHMENTS}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-icons-outlined text-lg">attach_file</span>
            {files.length >= MAX_ATTACHMENTS ? "En fazla 5 ek" : "Dosya ekle"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[200px]">
          <textarea
            className="w-full h-full min-h-[180px] border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300 resize-none bg-transparent placeholder:text-slate-400 leading-relaxed"
            placeholder="Mesajınızı buraya yazın..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded-lg text-slate-500 transition-colors flex items-center gap-1.5"
          >
            <span className="material-icons-outlined">delete_outline</span>
            <span className="text-xs font-medium">İptal</span>
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
          >
            {sending ? "Gönderiliyor..." : "Gönder"}
            <span className="material-icons-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
