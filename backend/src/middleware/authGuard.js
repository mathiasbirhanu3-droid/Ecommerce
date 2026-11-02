const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const User = require('../modules/auth/auth.model');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME } = require('../utils/cookies');

const authGuard = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET); // jsonwebtoken (Node runtime) — ADR-05
  } catch {
    throw new AppError('Invalid or expired session — please log in again', 401);
  }

  // Fresh DB read each request: role demotion/deletion applies instantly (token role is UX-only).
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('Session no longer valid — please log in again', 401);

  // ADR-27 / FR-AUTH-09: reject tokens issued BEFORE the last password change (G-08).
  if (
    user.passwordChangedAt &&
    payload.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    throw new AppError('Your password changed — please log in again', 401);
  }

  req.user = user; // sanitized via toJSON (password & reset fields are select:false)
  // Step 3: attach req.user.vendorId here once the Vendor module exists.
  return next();
});

module.exports = authGuard;