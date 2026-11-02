const { env, isProd } = require('../config/env');

const COOKIE_NAME = 'token';

// env schema guarantees "7d" | "12h" | "30m" format (ADR-06)
const expiryToMs = (str) => {
  const match = /^(\d+)([dhm])$/.exec(str);
  const unitMs = { d: 86_400_000, h: 3_600_000, m: 60_000 }[match[2]];
  return Number(match[1]) * unitMs;
};

const cookieOptions = () => ({
  httpOnly: true, // XSS cannot read it (§11)
  secure: isProd, // HTTPS-only in production
  sameSite: 'lax', // CSRF stance (§5.4)
  domain: env.COOKIE_DOMAIN || undefined, // shared parent domain in prod (ADR-04); dev: ports ignored
  path: '/',
  maxAge: expiryToMs(env.JWT_EXPIRES_IN),
});

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, cookieOptions());

// Clearing MUST use identical options (domain included) or the browser keeps the old cookie — classic bug.
const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };