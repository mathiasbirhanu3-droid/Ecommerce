const crypto = require('node:crypto');

/** One-time URL-safe token (64 hex chars) — used for password reset (FR-AUTH-05). */
const generateRawToken = () => crypto.randomBytes(32).toString('hex');

/** Only the HASH is stored in DB — a DB dump cannot reset anyone's password (§11). */
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

module.exports = { generateRawToken, sha256 };