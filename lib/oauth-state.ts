import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("NEXTAUTH_SECRET required for OAuth state signing");
  }
  return secret;
}

export function signOAuthState(studentId: string): string {
  const payload = JSON.stringify({
    studentId,
    exp: Date.now() + STATE_TTL_MS,
  });
  const encoded = Buffer.from(payload, "utf-8").toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(encoded);
  const sig = hmac.digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyOAuthState(state: string): string | null {
  if (!state || typeof state !== "string") return null;
  const dot = state.indexOf(".");
  if (dot <= 0) return null;
  const encoded = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(encoded);
  const expected = hmac.digest("base64url");
  if (expected !== sig) return null;
  let payload: { studentId: string; exp: number };
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
  if (!payload.studentId || typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return null;
  }
  return payload.studentId;
}
