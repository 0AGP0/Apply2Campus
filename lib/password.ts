const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export type PasswordValidation = { ok: true } | { ok: false; error: string };

/**
 * Şifre politikası: en az 8 karakter, en fazla 128.
 */
export function validatePassword(password: string | null | undefined): PasswordValidation {
  if (password == null || typeof password !== "string") {
    return { ok: false, error: "Şifre gerekli" };
  }
  if (password.length < MIN_LENGTH) {
    return { ok: false, error: `Şifre en az ${MIN_LENGTH} karakter olmalı` };
  }
  if (password.length > MAX_LENGTH) {
    return { ok: false, error: `Şifre en fazla ${MAX_LENGTH} karakter olabilir` };
  }
  return { ok: true };
}
