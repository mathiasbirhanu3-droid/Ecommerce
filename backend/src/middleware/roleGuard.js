const AppError = require('../utils/AppError');

/**
 * Usage: router.patch('/x', authGuard, roleGuard('admin'), controller)
 * Roles are read from the FRESH DB user attached by authGuard — never from the token.
 */
const roleGuard = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to do that', 403));
  return next();
};

module.exports = roleGuard;