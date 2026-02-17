import filterXSS from "xss";

const EMAIL_WHITELIST: Record<string, string[]> = {
  p: [],
  br: [],
  div: [],
  span: [],
  a: ["href", "target", "rel", "title"],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  strike: [],
  ul: [],
  ol: [],
  li: [],
  h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  table: [], thead: [], tbody: [], tr: [], th: [], td: [],
  img: ["src", "alt", "title"],
  blockquote: [],
  pre: [],
  code: [],
  hr: [],
  sub: [],
  sup: [],
};

/**
 * E-posta HTML içeriğini XSS'e karşı güvenli hale getirir.
 */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  if (html == null || html === "") return "";
  return filterXSS(html, { whiteList: EMAIL_WHITELIST });
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
