const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendList } = require('../../utils/apiResponse');
const User = require('../auth/auth.model');
const Product = require('../products/products.model');
const vendorsService = require('../vendors/vendors.service');

// GET /admin/stats — FR-ADM-01 (orders count joins in Step 6 with the orders model)
exports.stats = asyncHandler(async (_req, res) => {
  const [users, vendors, vendorsPending, products] = await Promise.all([
    User.countDocuments(),
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: 'pending' }),
    Product.countDocuments({ isActive: true }),
  ]);
  return sendSuccess(res, {
    message: 'Platform stats',
    data: { users, vendors, vendorsPending, products },
  });
});

exports.listVendors = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await vendorsService.adminList(req.validated.query);
  return sendList(res, { message: 'Vendors', items, page, limit, total });
});

exports.setVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.adminSetStatus(req.validated.params.id, req.validated.body.status);
  return sendSuccess(res, { message: `Vendor ${vendor.status}`, data: { vendor } });
});