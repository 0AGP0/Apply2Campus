import fs from "fs";
import path from "path";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

/** Dosya adını diske yazmak için güvenli hale getirir (.. ve path separator yok). */
function safeBasename(name: string | null | undefined, fallback = "dosya"): string {
  if (name == null || typeof name !== "string") return fallback;
  const cleaned = name.replace(/[\\/<>:"|?*\x00-\x1f]/g, "").trim().slice(0, 200);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Öğrenci belgesini diske yazar. Path: data/uploads/{studentId}/{fieldSlug}/{id}_{filename}
 * @returns DB'de saklanacak relative path (studentId/fieldSlug/id_filename)
 */
export function saveDocument(
  buffer: Buffer,
  studentId: string,
  fieldSlug: string,
  originalFilename: string,
  documentId: string
): string {
  const dir = path.join(UPLOAD_BASE, studentId, fieldSlug);
  fs.mkdirSync(dir, { recursive: true });
  const base = safeBasename(originalFilename);
  const filename = `${documentId}_${base}`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, buffer);
  return path.join(studentId, fieldSlug, filename).replace(/\\/g, "/");
}

/**
 * DB'deki relative path ile dosyanın tam yolunu döner.
 */
export function getDocumentFullPath(relativePath: string): string {
  return path.join(UPLOAD_BASE, relativePath);
}

/**
 * Dosya var mı kontrol eder.
 */
export function documentExists(relativePath: string): boolean {
  const full = getDocumentFullPath(relativePath);
  return fs.existsSync(full) && fs.statSync(full).isFile();
}

/**
 * Dosyayı stream olarak okur (indirme API için).
 */
export function createReadStream(relativePath: string): fs.ReadStream {
  const full = getDocumentFullPath(relativePath);
  if (!documentExists(relativePath)) throw new Error("File not found");
  return fs.createReadStream(full);
}
