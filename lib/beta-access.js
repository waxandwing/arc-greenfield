import { createHash, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'arc_beta_access';
export const EXPECTED_PASSWORD_HASH = '02960e0be166e38c3f854ece834f50973db2f54fb8f3b969a8978ebf722dc280';
export const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function safeEqual(left, right) {
  const a = Buffer.from(left || '', 'utf8');
  const b = Buffer.from(right || '', 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function accessToken() {
  return sha256(`arc-beta-access:${EXPECTED_PASSWORD_HASH}`);
}

export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(pair => {
    const idx = pair.indexOf('=');
    return idx < 0 ? [pair, ''] : [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
  }));
}

export function requestIsUnlocked(req) {
  const storedToken = parseCookies(req.headers?.cookie)[COOKIE_NAME] ?? '';
  return safeEqual(storedToken, accessToken());
}
