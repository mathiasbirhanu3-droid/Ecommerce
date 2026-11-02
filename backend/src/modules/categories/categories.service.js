const Category = require('./categories.model');
const Product = require('../products/products.model');
const AppError = require('../../utils/AppError');
const { uniqueSlug } = require('../../utils/slugify');

// FR-CAT-01 — public read: active only, .lean(), explicit select.
const listActive = async () =>
  Category.find({ isActive: true }).select('name slug image parent').sort({ name: 1 }).lean();

// Nested tree for the MegaMenu — built in memory (MVP scale: a few dozen docs, O(n)).
const tree = async () => {
  const all = await listActive();
  const byId = new Map(all.map((c) => [c._id.toString(), { ...c, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    const parentLink = node.parent ? byId.get(node.parent.toString()) : null;
    if (parentLink) parentLink.children.push(node);
    else roots.push(node);
  }
  return roots;
};

const create = async ({ name, image, parent }) => {
  if (parent && !(await Category.exists({ _id: parent, isActive: true }))) {
    throw new AppError('Parent category not found', 404);
  }
  const slug = await uniqueSlug(Category, name);
  return Category.create({ name, slug, image, parent });
};

const update = async (id, patch) => {
  if (patch.parent && String(patch.parent) === String(id)) {
    throw new AppError('A category cannot be its own parent', 400);
  }
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found', 404);
  Object.assign(category, patch);
  await category.save();
  return category;
};

// FR-CAT-03 / G-09 — soft delete, GUARDED. Deactivation (not deletion) keeps order
// history references intact; 409 tells the admin exactly what to fix first.
const softDelete = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  const [activeProducts, activeChild] = await Promise.all([
    Product.exists({ category: id, isActive: true }),
    Category.exists({ parent: id, isActive: true }),
  ]);
  if (activeProducts) throw new AppError('This category still has active products — reassign them first', 409);
  if (activeChild) throw new AppError('Deactivate this category\u2019s subcategories first', 409);

  category.isActive = false;
  await category.save();
  return category;
};

module.exports = { listActive, tree, create, update, softDelete };