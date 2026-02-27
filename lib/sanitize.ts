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
 */
export function safeEmailBodyHtml(bodyHtml: string | null | undefined, snippet?: string | null): string {
  if (bodyHtml != null && bodyHtml !== "") return sanitizeEmailHtml(bodyHtml);
  return snippetToSafeHtml(snippet ?? "");
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
