const crypto = require('node:crypto');
const Product = require('./products.model');
const Vendor = require('../vendors/vendors.model');
const Category = require('../categories/categories.model');
const AppError = require('../../utils/AppError');
const { slugify, uniqueSlug } = require('../../utils/slugify');
const { parseListQuery } = require('../../utils/apiFeatures');
const { env } = require('../../config/env');

const LIST_SELECT = 'name slug price comparePrice images stock sold avgRating numReviews vendor category isActive createdAt';
const LIST_POPULATE = [
  { path: 'vendor', select: 'storeName slug logo' },
  { path: 'category', select: 'name slug' },
];

// ADR-11/FR-VEN-02 — EVERY public query filters: product active AND vendor approved.
// Query-time join means a suspended vendor's products vanish instantly, everywhere.
const approvedVendorIds = async () => Vendor.find({ status: 'approved' }).distinct('_id');

// FR-SRH-01/02 — public listing: search (text index) + filters + sort + pagination.
const listPublic = async (q = {}) => {
  const { page, limit, skip, sort } = parseListQuery(q, {
    sortMap: { newest: { createdAt: -1 }, price: { price: 1 }, '-price': { price: -1 } },
    defaultSort: 'newest',
  });

  const vendorFilter = { $in: await approvedVendorIds() };

  // Vendor filter: not approved / unknown → structurally empty result (no error leak).
  if (q.vendor) {
    const vendor = await Vendor.findOne({ slug: q.vendor, status: 'approved' }).select('_id').lean();
    if (!vendor) return { items: [], page, limit, total: 0 };
    vendorFilter.$in = [vendor._id];
  }

  const filter = { isActive: true, vendor: vendorFilter };

  if (q.category) {
    const cat = await Category.findOne({ slug: q.category, isActive: true }).select('_id').lean();
    if (!cat) return { items: [], page, limit, total: 0 };
    const childIds = await Category.find({ parent: cat._id }).distinct('_id'); // parents include children (UX)
    filter.category = { $in: [cat._id, ...childIds] };
  }

  if (q.price && (q.price.gte != null || q.price.lte != null)) {
    filter.price = {};
    if (q.price.gte != null) filter.price.$gte = q.price.gte;
    if (q.price.lte != null) filter.price.$lte = q.price.lte;
  }

  let effectiveSort = sort;
  if (q.search) {
    filter.$text = { $search: q.search }; // ADR-14 — swap point for Meilisearch later
    if (!q.sort) effectiveSort = { score: { $meta: 'textScore' } }; // relevance by default
  }

  const [items, total] = await Promise.all([
    Product.find(filter).select(LIST_SELECT).populate(LIST_POPULATE).sort(effectiveSort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { items, page, limit, total };
};

// PDP — 404 when missing, inactive, or vendor not approved (no existence leaks).
const getBySlug = async (slug) => {
  const product = await Product.findOne({ slug }).populate('vendor', 'storeName slug logo status').lean();
  if (!product || !product.isActive || product.vendor?.status !== 'approved') {
    throw new AppError('Product not found', 404);
  }
  delete product.vendor.status; // internal state never reaches clients
  return product;
};

// FR-PRD-06 — same category, active, exclude self, limit 8, deterministic (sold desc);
// fallback: platform top-sellers when fewer than 3 matches.
const related = async (productId) => {
  const product = await Product.findOne({ _id: productId, isActive: true }).select('category').lean();
  if (!product) throw new AppError('Product not found', 404);

  const vendorFilter = { $in: await approvedVendorIds() };
  const base = { isActive: true, vendor: vendorFilter, _id: { $ne: product._id } };

  let items = await Product.find({ ...base, category: product.category })
    .select(LIST_SELECT).populate(LIST_POPULATE)
    .sort({ sold: -1 }).limit(8).lean();

  if (items.length < 3) {
    const excludeIds = [product._id, ...items.map((i) => i._id)];
    const fill = await Product.find({ ...base, _id: { $nin: excludeIds } })
      .select(LIST_SELECT).populate(LIST_POPULATE)
      .sort({ sold: -1 }).limit(8 - items.length).lean();
    items = items.concat(fill);
  }
  return items;
};

// FR-PRD-01 + FR-PRD-08 + FR-VEN-02 — vendor creation with status gate & cap.
const createMine = async (vendor, data) => {
  if (vendor.status !== 'approved') throw new AppError('Your store must be approved before listing products', 403);

  const activeCount = await Product.countDocuments({ vendor: vendor._id, isActive: true });
  if (activeCount >= env.PRODUCT_CAP_PER_VENDOR) {
    throw new AppError(`Product limit reached (${env.PRODUCT_CAP_PER_VENDOR}) — deactivate items to add more`, 409);
  }

  const category = await Category.findOne({ _id: data.categoryId, isActive: true });
  if (!category) throw new AppError('Category not found', 404);

  // slug from name; uniqueSlug retries with a random suffix — two vendors selling
  // "Leather Wallet" coexist (classic marketplace collision, handled by design).
  const slug = await uniqueSlug(Product, data.name);
  const { categoryId, ...rest } = data;
  return Product.create({ ...rest, slug, vendor: vendor._id, category: categoryId });
};

// OWNERSHIP SCOPING — the query itself contains vendor:_id. A vendor touching another
// vendor's product gets a clean 404 (never 403 — existence is not leaked).
const updateMine = async (vendor, productId, patch) => {
  const product = await Product.findOne({ _id: productId, vendor: vendor._id });
  if (!product) throw new AppError('Product not found', 404);

  if (patch.categoryId) {
    const category = await Category.findOne({ _id: patch.categoryId, isActive: true });
    if (!category) throw new AppError('Category not found', 404);
    product.category = patch.categoryId;
  }
  for (const key of ['name', 'description', 'price', 'comparePrice', 'stock', 'images', 'options']) {
    if (patch[key] !== undefined) product[key] = patch[key];
  }
  // slug is IMMUTABLE after creation — links/SEO/QR codes never break (decision).
  await product.save();
  return product;
};

const softDeleteMine = async (vendor, productId) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, vendor: vendor._id }, // ownership in the query — atomic, race-free
    { isActive: false },
    { new: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

// FR-PRD-04 — admin moderation (any product, deactivate/restore).
const moderate = async (productId, isActive) => {
  const product = await Product.findByIdAndUpdate(productId, { isActive }, { new: true });
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

// Vendor's own inventory — includes inactive (they manage, they see).
const listMine = async (vendorId, query = {}) => {
  const { page, limit, skip } = parseListQuery(query, {
    sortMap: { newest: { createdAt: -1 }, price: { price: 1 }, '-price': { price: -1 } },
    defaultSort: 'newest',
  });
  const filter = { vendor: vendorId };
  const [items, total] = await Promise.all([
    Product.find(filter).select(LIST_SELECT).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { items, page, limit, total };
};

// Step 6 checkout will import THIS atomic decrement (kept here so the money path is testable early):
// ADR-09 — returns null when stock insufficient → checkout rolls back the whole transaction.
const decrementStock = (productId, qty, session) =>
  Product.findOneAndUpdate(
    { _id: productId, isActive: true, stock: { $gte: qty } },
    { $inc: { stock: -qty, sold: qty } },
    { new: true, session }
  ).lean();

module.exports = {
  listPublic, getBySlug, related,
  createMine, updateMine, softDeleteMine, moderate, listMine,
  decrementStock, slugify, crypto,
};