const Vendor = require('./vendors.model');
const User = require('../auth/auth.model');
const AppError = require('../../utils/AppError');
const { uniqueSlug } = require('../../utils/slugify');
const { parseListQuery } = require('../../utils/apiFeatures');

const PUBLIC_FIELDS = 'storeName slug logo banner description shippingFee freeShippingOver';

// UC-02 — actor is strictly a Customer (admins/users-with-stores are rejected → approve can
// never demote an admin to vendor, a subtle privilege bug prevented by design).
const apply = async (user, { storeName, description, logo, banner }) => {
  if (user.role !== 'customer') throw new AppError('Only customer accounts can apply as vendors', 403);
  if (await Vendor.exists({ owner: user._id })) throw new AppError('You already have a store application', 409);

  const slug = await uniqueSlug(Vendor, storeName);
  return Vendor.create({ owner: user._id, storeName, slug, description, logo, banner });
};

// Frontend state machine: 404 → show apply form, pending/approved/suspended → render accordingly.
const getMine = async (userId) => {
  const vendor = await Vendor.findOne({ owner: userId });
  if (!vendor) throw new AppError('No vendor profile found', 404);
  return vendor;
};

// FR-VEN-04 — explicit field whitelist: slug, status & commissionRate are NEVER client-settable.
const updateMine = async (vendorId, patch) => {
  const allowed = {};
  for (const key of ['storeName', 'description', 'logo', 'banner', 'shippingFee', 'freeShippingOver']) {
    if (patch[key] !== undefined) allowed[key] = patch[key];
  }
  if (allowed.storeName && allowed.storeName !== (await Vendor.findById(vendorId)).storeName) {
    allowed.storeName = allowed.storeName; // rename allowed; slug stays stable for SEO (decision)
  }
  const vendor = await Vendor.findOneAndUpdate({ _id: vendorId }, allowed, { new: true, runValidators: true });
  if (!vendor) throw new AppError('Vendor not found', 404);
  return vendor;
};

// FR-VEN-05 — public store data, approved vendors ONLY (suspended/pending → 404, no leak).
const getPublicBySlug = async (slug) => {
  const vendor = await Vendor.findOne({ slug, status: 'approved' }).select(PUBLIC_FIELDS).lean();
  if (!vendor) throw new AppError('Store not found', 404);
  return vendor;
};

// ── Admin (UC-03) ──────────────────────────────────────────────
const adminList = async (query = {}) => {
  const { page, limit, skip } = parseListQuery(query, { defaultSort: 'newest', sortMap: { newest: { createdAt: -1 } } });
  const filter = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email') // explicit select — never populate whole docs (§7.3)
      .lean(),
    Vendor.countDocuments(filter),
  ]);
  return { items, page, limit, total };
};

const adminSetStatus = async (vendorId, status) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new AppError('Vendor not found', 404);

  vendor.status = status;
  await vendor.save();

  // Approval promotes the owner customer → vendor (Edge /vendor gate then admits them).
  // Suspension keeps the role: they can still log in and SEE their suspended dashboard.
  if (status === 'approved') {
    await User.updateOne({ _id: vendor.owner, role: 'customer' }, { role: 'vendor' });
  }
  return vendor;
};

module.exports = { apply, getMine, updateMine, getPublicBySlug, adminList, adminSetStatus };