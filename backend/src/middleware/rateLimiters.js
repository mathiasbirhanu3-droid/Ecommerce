const rateLimit = require('express-rate-limit');

const body = (message) => ({ success: false, message });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: body('Too many requests — please slow down.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: body('Too many attempts — try again in 15 minutes.'),
});

const suggestionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: body('Too many searches — slow down a little.'),
});

// G-07 — keyed PER USER; mounted AFTER authGuard in the checkout route so req.user exists
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: body('Too many checkout attempts — please wait a few minutes.'),
});

module.exports = { globalLimiter, authLimiter, suggestionsLimiter, checkoutLimiter };