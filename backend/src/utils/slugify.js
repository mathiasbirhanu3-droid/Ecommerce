const crypto = require('node:crypto');
const AppError = require('./AppError');

// FR-VEN-06: vendor slugs can never squat on app routes.
const RESERVED_SLUGS = new Set([
  'admin', 'vendor', 'vendors', 'api', 'account', 'checkout', 'cart', 'order', 'orders',
  'login', 'register', 'legal', 'about', 'contact', 'help', 'support', 'vendora', 'search',
  'store', 'products', 'categories', 'uploads', 'assets', 'static',
]);

const slugify = (value) => {
  const slug = String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'item';
};

const isReserved = (slug) => RESERVED_SLUGS.has(slug);

/**
 * Generates a unique slug for any model. Retries with a random suffix on collision
 * (two vendors CAN pick the same store name pattern → 11000 errors become impossible).
 */
const uniqueSlug = async (Model, base, { field = 'slug', maxTries = 3 } = {}) => {
  const baseSlug = slugify(base);
  if (isReserved(baseSlug)) throw new AppError('That name is reserved — please choose another', 422);

  let candidate = baseSlug;
  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists({ [field]: candidate });
    if (!exists) return candidate;
    candidate = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
  }
  throw new AppError('Could not generate a unique URL — please try a different name', 409);
};

module.exports = { slugify, isReserved, uniqueSlug, RESERVED_SLUGS };