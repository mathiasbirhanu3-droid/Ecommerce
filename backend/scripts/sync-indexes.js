/* eslint-disable no-console */
// Run in production (or after index changes): builds/verifies ALL indexes explicitly.
require('dotenv').config();
const User = require('../src/modules/auth/auth.model');
const Vendor = require('../src/modules/vendors/vendors.model');
const Category = require('../src/modules/categories/categories.model');
const Product = require('../src/modules/products/products.model');
const { connectDB, disconnectDB } = require('../src/config/db');

(async () => {
  await connectDB();
  for (const Model of [User, Vendor, Category, Product]) {
    const indexes = await Model.syncIndexes();
    console.log(`✅ ${Model.modelName}: ${Object.keys(indexes || {}).length || 'all'} indexes synced`);
  }
  await disconnectDB();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });