const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendList } = require('../../utils/apiResponse');
const categoriesService = require('./categories.service');

exports.list = asyncHandler(async (_req, res) => {
  const items = await categoriesService.listActive();
  return sendList(res, { message: 'Categories', items, page: 1, limit: items.length, total: items.length });
});

exports.tree = asyncHandler(async (_req, res) => {
  const items = await categoriesService.tree();
  return sendSuccess(res, { message: 'Category tree', data: { items } });
});

exports.create = asyncHandler(async (req, res) => {
  const category = await categoriesService.create(req.validated.body);
  return sendSuccess(res, { status: 201, message: 'Category created', data: { category } });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await categoriesService.update(req.validated.params.id, req.validated.body);
  return sendSuccess(res, { message: 'Category updated', data: { category } });
});

exports.remove = asyncHandler(async (req, res) => {
  await categoriesService.softDelete(req.validated.params.id);
  return sendSuccess(res, { message: 'Category deactivated' });
});