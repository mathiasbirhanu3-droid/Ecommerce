/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/auth/auth.model');
const Vendor = require('../src/modules/vendors/vendors.model');
const Category = require('../src/modules/categories/categories.model');
const Product = require('../src/modules/products/products.model');
const { connectDB, disconnectDB } = require('../src/config/db');
const { slugify } = require('../src/utils/slugify');

// Cloudinary's public demo cloud — safe placeholder assets. Replace with your own uploads before launch.
const IMG = (id) => `https://res.cloudinary.com/demo/image/upload/w_900,h_900,c_fill,q_auto,f_auto/${id}.jpg`;

const upsertUser = async (data) => {
  const existing = await User.findOne({ email: data.email }).select('+password');
  if (existing) return existing;
  return User.create(data); // pre-save hook hashes the password
};

const upsertCategory = async (data) =>
  Category.findOneAndUpdate({ slug: data.slug }, data, { new: true, upsert: true });

const upsertProduct = async (data) =>
  Product.findOneAndUpdate({ slug: data.slug }, data, { new: true, upsert: true });

(async () => {
  try {
    await connectDB();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vendora.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPass1';
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn('⚠️  Using default seed passwords — set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD before any real deployment.');
    }

    // 1) Admin + vendor owner (FR doc §12)
    const admin = await upsertUser({ name: 'Amina Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    const vendorOwner = await upsertUser({ name: 'Omar Craft', email: 'vendor@vendora.local', password: 'VendorPass1', role: 'customer' });

    // 2) One approved vendor (FR-VEN-02/03)
    const vendor = await Vendor.findOneAndUpdate(
      { owner: vendorOwner._id },
      {
        owner: vendorOwner._id,
        storeName: 'Sheba Handcrafts',
        slug: 'sheba-handcrafts',
        description: 'Handwoven textiles, pottery and leatherwork from Ethiopian artisans.',
        logo: IMG('cld-sample'),
        banner: IMG('cld-sample-2'),
        status: 'approved',
        shippingFee: 500,           // $5.00 (ADR-07 cents)
        freeShippingOver: 5000,     // $50.00
        commissionRate: 0,
      },
      { new: true, upsert: true }
    );
    if (vendorOwner.role !== 'admin') await User.findByIdAndUpdate(vendorOwner._id, { role: 'vendor' });

    // 3) Category tree (FR-CAT-01)
    const electronics = await upsertCategory({ name: 'Electronics', slug: 'electronics' });
    const fashion = await upsertCategory({ name: 'Fashion & Textiles', slug: 'fashion-textiles' });
    const home = await upsertCategory({ name: 'Home & Living', slug: 'home-living' });
    const coffee = await upsertCategory({ name: 'Coffee & Spices', slug: 'coffee-spices' });
    const audio = await upsertCategory({ name: 'Audio', slug: 'audio', parent: electronics._id });
    const women = await upsertCategory({ name: 'Women', slug: 'women', parent: fashion._id });
    const men = await upsertCategory({ name: 'Men', slug: 'men', parent: fashion._id });

    // 4) 20 demo products (prices in cents)
    const P = (name, category, price, comparePrice, stock, sold, img, options) => ({
      vendor: vendor._id, category: category._id, name, slug: slugify(name),
      description: `${name} — crafted by Sheba Handcrafts. Quality materials, fair-trade production, shipped with care.`,
      price, comparePrice: comparePrice ?? null, stock, sold,
      images: [{ url: IMG(img), alt: name }], options: options || [],
      isActive: true,
    });

    const products = [
      P('Wireless Earbuds Pro', audio, 8500, 9999, 40, 12, 'cld-sample-3', [{ name: 'Color', values: ['Black', 'White'] }]),
      P('Bluetooth Speaker Mini', audio, 6200, null, 55, 8, 'cld-sample-4'),
      P('Over-Ear Studio Headphones', audio, 14500, 17900, 20, 5, 'cld-sample-5'),
      P('Handwoven Habesha Kemis Dress', women, 12000, 15000, 15, 21, 'woman', [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }]),
      P('Traditional Netela Shawl', women, 5500, null, 30, 17, 'sample'),
      P('Leather Crossbody Bag', women, 9800, 11500, 25, 14, 'cld-sample-2', [{ name: 'Color', values: ['Brown', 'Black'] }]),
      P('Cotton Habesha Shirt', men, 7000, null, 35, 11, 'couple', [{ name: 'Size', values: ['M', 'L', 'XL'] }]),
      P('Woven Straw Hat', men, 3200, 4000, 60, 26, 'shoes'),
      P('Leather Belt Classic', men, 4500, null, 45, 9, 'brown_sheep'),
      P('Yirgacheffe Coffee Beans 1kg', coffee, 2800, 3400, 100, 64, 'coffee_cup'),
      P('Sidamo Coffee Beans 500g', coffee, 1600, null, 120, 38, 'coffee_cup'),
      P('Berbere Spice Blend 250g', coffee, 900, null, 150, 41, 'sample'),
      P('Handmade Clay Coffee Set', home, 7500, 8900, 18, 7, 'balloons'),
      P('Mesob Woven Table', home, 22000, null, 6, 3, 'cld-sample-4'),
      P('Injera Basket Traditional', home, 4200, 5000, 22, 13, 'cld-sample-3'),
      P('Cotton Throw Blanket', home, 6800, null, 28, 10, 'kitten'),
      P('Beaded Wall Hanging', home, 5400, 6400, 16, 6, 'dog'),
      P('Phone Stand Wooden', electronics, 1500, null, 80, 33, 'cld-sample-5'),
      P('Canvas Everyday Backpack', fashion, 8900, 10500, 30, 19, 'cld-sample'),
      P('Silk Scarf Pastel', women, 4700, null, 50, 23, 'balloons', [{ name: 'Color', values: ['Rose', 'Sky', 'Sand'] }]),
    ];

    for (const p of products) await upsertProduct(p);

    console.log('✅ Seed complete:');
    console.log(`   admin:    ${admin.email}${process.env.SEED_ADMIN_PASSWORD ? '' : ' / AdminPass1 (CHANGE IT)'}`);
    console.log('   vendor:   vendor@vendora.local / VendorPass1 → Sheba Handcrafts (approved)');
    console.log(`   products: ${products.length} · categories: 8`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
})();