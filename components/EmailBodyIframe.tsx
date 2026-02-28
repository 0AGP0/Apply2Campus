"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/** E-posta gövdesini iframe'de gösterir; içerik yüklenince yüksekliği otomatik ayarlar. */
export function EmailBodyIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);
  const measure = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const bodyH = doc.body?.scrollHeight ?? 0;
      const docH = doc.documentElement?.scrollHeight ?? 0;
      const h = Math.max(bodyH, docH, 200);
      setHeight(Math.min(h, 3000));
    } catch {
      setHeight(600);
    }
  }, []);
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (ms: number) => {
      const t = setTimeout(measure, ms);
      timeouts.push(t);
    };
    const onLoad = () => {
      measure();
      schedule(300);
      schedule(1000);
    };
    iframe.onload = onLoad;
    schedule(100);
    return () => timeouts.forEach(clearTimeout);
  }, [measure, html]);
  return (
    <iframe
      ref={iframeRef}
      title="E-posta içeriği"
      sandbox="allow-same-origin allow-popups"
      srcDoc={html}
      className="w-full border-0"
      style={{ minHeight: 200, height: `${height}px`, display: "block" }}
    />
  );
}
