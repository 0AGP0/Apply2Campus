/**
 * Basit in-memory rate limiter (tek sunucu örneği için).
 * Production'da çoklu instance için Redis tabanlı (örn. @upstash/ratelimit) kullanılmalı.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 dakika
const MAX_REGISTER_PER_IP = 5;
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

function key(prefix: string, ip: string): string {
  return `${prefix}:${ip}`;
}

/**
 * Register için: IP başına 15 dakikada en fazla MAX_REGISTER_PER_IP istek.
 * Limit aşılırsa false döner.
 */
export function checkRegisterRateLimit(ip: string): boolean {
  cleanup();
  const k = key("register", ip);
  const now = Date.now();
  let entry = store.get(k);
  if (!entry) {
    store.set(k, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(k, entry);
    return true;
  }
  if (entry.count >= MAX_REGISTER_PER_IP) return false;
  entry.count++;
  return true;
}

const MAX_LOGIN_ATTEMPTS_PER_EMAIL = 10;

/**
 * Login için: email başına 15 dakikada en fazla MAX_LOGIN_ATTEMPTS_PER_EMAIL deneme.
 */
export function checkLoginRateLimitByEmail(email: string): boolean {
  cleanup();
  const k = key("login", email.toLowerCase().trim());
  const now = Date.now();
  let entry = store.get(k);
  if (!entry) return true;
  if (now >= entry.resetAt) return true;
  return entry.count < MAX_LOGIN_ATTEMPTS_PER_EMAIL;
}

export function incrementLoginAttempts(email: string): void {
  cleanup();
  const k = key("login", email.toLowerCase().trim());
  const now = Date.now();
  let entry = store.get(k);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  store.set(k, entry);
}

/**
 * İstek IP'sini header'lardan alır (proxy arkada ise x-forwarded-for / x-real-ip).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
