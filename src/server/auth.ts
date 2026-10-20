import './db';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { getCookie, setCookie, deleteCookie, getRequest } from '@tanstack/react-start/server';
const cookie = 'bizdir_admin';
const localSecret = randomBytes(32).toString('hex');
function sign(value: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET || localSecret)
    .update(value)
    .digest('hex');
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function isAuthenticated() {
  const value = getCookie(cookie);
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  const [expires, signature] = value.split('.');
  return Number(expires) > Date.now() && !!signature && equal(signature, sign(expires));
}
export function requireAdmin() {
  if (!isAuthenticated()) throw new Error('Your session has expired. Sign in again.');
}
export function checkOrigin() {
  const request = getRequest();
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host)
    throw new Error('Cross-origin request rejected.');
}
const attempts = new Map<string, { count: number; until: number }>();
export function login(password: string) {
  checkOrigin();
  if (!process.env.ADMIN_PASSWORD)
    throw new Error('Set ADMIN_PASSWORD in .env.local before signing in.');
  const key = new URL(getRequest().url).host;
  const entry = attempts.get(key);
  if (entry && entry.until > Date.now() && entry.count >= 10)
    throw new Error('Too many sign-in attempts. Try again in 15 minutes.');
  if (!equal(password, process.env.ADMIN_PASSWORD)) {
    attempts.set(key, {
      count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
      until: Date.now() + 900000
    });
    throw new Error('Incorrect admin password.');
  }
  attempts.delete(key);
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  setCookie(cookie, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: new URL(getRequest().url).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60
  });
  return true;
}
export function logout() {
  checkOrigin();
  deleteCookie(cookie, { path: '/' });
}
