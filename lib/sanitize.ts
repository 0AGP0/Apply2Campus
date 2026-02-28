import filterXSS from "xss";

/** E-posta HTML'inde izin verilen tag ve attribute'lar. Gmail vb. maillerde stil ve tablo düzeni için style/width/bgcolor vb. gerekir. */
const EMAIL_WHITELIST: Record<string, string[]> = {
  p: ["style"],
  br: [],
  div: ["style"],
  span: ["style"],
  a: ["href", "target", "rel", "title", "style"],
  strong: ["style"],
  b: ["style"],
  em: ["style"],
  i: ["style"],
  u: ["style"],
  s: ["style"],
  strike: ["style"],
  ul: ["style"],
  ol: ["style"],
  li: ["style"],
  h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
  table: ["style", "width", "height", "align", "cellpadding", "cellspacing", "border"],
  thead: ["style"],
  tbody: ["style"],
  tr: ["style"],
  th: ["style", "width", "height", "align", "valign", "bgcolor"],
  td: ["style", "width", "height", "align", "valign", "bgcolor"],
  img: ["src", "alt", "title", "style", "width", "height"],
  blockquote: ["style"],
  pre: ["style"],
  code: ["style"],
  hr: ["style"],
  sub: ["style"],
  sup: ["style"],
  font: ["size", "color", "face", "style"],
};

/**
 * E-posta HTML içeriğini XSS'e karşı güvenli hale getirir.
 * Gmail gibi tam sayfa HTML (<!DOCTYPE><html><body>...) gelirse sadece body içeriği alınır, böylece render edilebilir.
 * style attribute'ları xss'in cssfilter'ı ile filtrelenir.
 */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  if (html == null || html === "") return "";
  let content = html.trim();
  // Tam sayfa HTML ise sadece <body> içeriğini al (aksi halde xss whitelist dışı tag'ler yüzünden tümü escape edilip metin gibi görünür)
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body\s*>/i);
  if (bodyMatch) content = bodyMatch[1];
  return filterXSS(content, {
    whiteList: EMAIL_WHITELIST,
  });
}

/**
 * Düz metin snippet'ı güvenli HTML paragrafına çevirir (XSS önlemi).
 */
export function snippetToSafeHtml(snippet: string | null | undefined): string {
  if (snippet == null || snippet === "") return "<p></p>";
  const escaped = filterXSS(snippet, { whiteList: {} });
  return `<p>${escaped}</p>`;
}

/**
 * E-posta gövdesi veya snippet için tek noktadan güvenli HTML döndürür.
 * E-posta varsa iframe için minimal sanitize edilmiş HTML döner (Gmail gibi tam render).
 * Yoksa snippet düz metin olarak.
 */
export function safeEmailBodyHtml(bodyHtml: string | null | undefined, snippet?: string | null): string {
  if (bodyHtml != null && bodyHtml !== "") return sanitizeEmailForIframe(bodyHtml);
  return snippetToSafeHtml(snippet ?? "");
}

/**
 * E-postayı iframe'de Gmail gibi göstermek için minimal sanitizasyon.
 * Sadece tehlikeli öğeler (script, iframe, event handler, javascript:) kaldırılır;
 * HTML, CSS, link, meta, stil tamamen korunur.
 * Iframe sandbox ile script zaten çalışmaz; bu ek güvenlik.
 */
export function sanitizeEmailForIframe(html: string | null | undefined): string {
  if (html == null || html === "") return "";
  let s = html.trim();
  // <script>...</script> ve <script src="..."> kaldır
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  s = s.replace(/<script\b[^>]*\/?>/gi, "");
  // <iframe>, <object>, <embed> kaldır
  s = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, "");
  s = s.replace(/<iframe\b[^>]*\/?>/gi, "");
  s = s.replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, "");
  s = s.replace(/<object\b[^>]*\/?>/gi, "");
  s = s.replace(/<embed\b[^>]*\/?>/gi, "");
  // Event handler attribute'ları kaldır (onclick, onload, onerror vb.)
  s = s.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  s = s.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
  // javascript: ve vbscript: href/src'de # ile değiştir
  s = s.replace(/((?:href|src)\s*=\s*["'])\s*javascript:[^"']*(["'])/gi, "$1#$2");
  s = s.replace(/((?:href|src)\s*=\s*["'])\s*vbscript:[^"']*(["'])/gi, "$1#$2");
  return s;
}

/** HTTP header'da kullanılacak dosya adını güvenli hale getirir (CR/LF ve kontrol karakterleri kaldırılır). */
export function safeFilename(filename: string | null | undefined, fallback = "ek"): string {
  if (filename == null || typeof filename !== "string") return fallback;
  const cleaned = filename.replace(/[\r\n\x00-\x1f"]/g, "").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 255) : fallback;
}

/** MIME/email header değerinde satır sonu enjeksiyonunu önler (To, Subject, Cc, Bcc). */
export function safeEmailHeaderValue(value: string | null | undefined): string {
  if (value == null || typeof value !== "string") return "";
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
}
