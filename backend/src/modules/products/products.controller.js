const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendList } = require('../../utils/apiResponse');
const productsService = require('./products.service');

// GET /products — public (ISR-consumed in Step 4)
exports.list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await productsService.listPublic(req.validated.query);
  return sendList(res, { message: 'Products', items, page, limit, total });
});

// GET /products/slug/:slug — public PDP payload
exports.getBySlug = asyncHandler(async (req, res) => {
  const product = await productsService.getBySlug(req.validated.params.slug);
  return sendSuccess(res, { message: 'Product', data: { product } });
});

// GET /products/:id/related — FR-PRD-06
exports.related = asyncHandler(async (req, res) => {
  const items = await productsService.related(req.validated.params.id);
  return sendSuccess(res, { message: 'Related products', data: { items } });
});

// POST /products — vendor (FR-PRD-01/08)
exports.create = asyncHandler(async (req, res) => {
  const product = await productsService.createMine(req.vendor, req.validated.body);
  return sendSuccess(res, { status: 201, message: 'Product created', data: { product } });
});

// PATCH /products/:id — vendor (ownership-scoped)
exports.update = asyncHandler(async (req, res) => {
  const product = await productsService.updateMine(req.vendor, req.validated.params.id, req.validated.body);
  return sendSuccess(res, { message: 'Product updated', data: { product } });
});

// DELETE /products/:id — vendor soft delete (ADR-11)
exports.remove = asyncHandler(async (req, res) => {
  await productsService.softDeleteMine(req.vendor, req.validated.params.id);
  return sendSuccess(res, { message: 'Product deactivated' });
});

// GET /vendors/me/products — vendor inventory (wired from vendors.routes)
exports.listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await productsService.listMine(req.vendor._id, req.validated.query);
  return sendList(res, { message: 'Your products', items, page, limit, total });
});

// PATCH /products/:id/moderate — admin (FR-PRD-04)
exports.moderate = asyncHandler(async (req, res) => {
  const product = await productsService.moderate(req.validated.params.id, req.validated.body.isActive);
  return sendSuccess(res, { message: product.isActive ? 'Product restored' : 'Product deactivated', data: { product } });
});