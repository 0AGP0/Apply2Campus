"use client";

const CATEGORIES = [
  { id: "kabul", title: "Üniversite Kabul Süreci", slug: "kabul", envKey: "NEXT_PUBLIC_VIDEO_PLAYLIST_KABUL" },
  { id: "vize", title: "Vizeye Doğru Liste", slug: "vize", envKey: "NEXT_PUBLIC_VIDEO_PLAYLIST_VIZE" },
  { id: "almanya", title: "Almanya Rehberi", slug: "almanya", envKey: "NEXT_PUBLIC_VIDEO_PLAYLIST_ALMANYA" },
];

export function VideolarClient() {
  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat) => {
        const playlistId = typeof process.env[cat.envKey] === "string" ? process.env[cat.envKey]!.trim() : "";
        return (
          <section
            key={cat.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{cat.title}</h2>
            </div>
            <div className="p-6">
              {playlistId ? (
                <div className="aspect-video max-w-3xl rounded-xl overflow-hidden bg-slate-900">
                  <iframe
                    title={cat.title}
                    src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video max-w-3xl bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
                    YouTube playlist için .env dosyasında <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">{cat.envKey}</code> tanımlayın.
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
