const Vendor = require('../modules/vendors/vendors.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Loads the Vendor document owned by the authenticated user → req.vendor.
 * 403 (not 404) when role says vendor but no store exists — signals data inconsistency.
 * Business rules (approved status, caps) stay in SERVICES — this only attaches context.
 */
const vendorGuard = asyncHandler(async (req, _res, next) => {
  const vendor = await Vendor.findOne({ owner: req.user._id });
  if (!vendor) return next(new AppError('Vendor account required', 403));
  req.vendor = vendor;
  return next();
});

module.exports = vendorGuard;