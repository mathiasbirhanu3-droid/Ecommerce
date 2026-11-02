const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendList } = require('../../utils/apiResponse');
const vendorsService = require('./vendors.service');
const productsController = require('../products/products.controller'); // composition-root wiring (GET /vendors/me/products)

// POST /vendors/apply — FR-VEN-01 / UC-02
exports.apply = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.apply(req.user, req.validated.body);
  return sendSuccess(res, { status: 201, message: 'Application received — awaiting admin approval', data: { vendor } });
});

// GET /vendors/me — session-scoped vendor state
exports.getMine = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.getMine(req.user._id);
  return sendSuccess(res, { message: 'Vendor profile', data: { vendor } });
});

// PATCH /vendors/me — FR-VEN-04
exports.updateMine = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.updateMine(req.vendor._id, req.validated.body);
  return sendSuccess(res, { message: 'Store settings saved', data: { vendor } });
});

// GET /vendors/slug/:slug — public store payload (FR-VEN-05)
exports.getPublicBySlug = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.getPublicBySlug(req.validated.params.slug);
  return sendSuccess(res, { message: 'Store', data: { vendor } });
});

// GET /vendors/me/products — doc-mandated path; logic lives in the products module (one source of truth).
exports.listMyProducts = productsController.listMine;

// ── Admin (UC-03) ──
exports.adminList = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await vendorsService.adminList(req.validated.query);
  return sendList(res, { message: 'Vendors', items, page, limit, total });
});

exports.adminSetStatus = asyncHandler(async (req, res) => {
  const vendor = await vendorsService.adminSetStatus(req.validated.params.id, req.validated.body.status);
  return sendSuccess(res, { message: `Vendor ${vendor.status}`, data: { vendor } });
});