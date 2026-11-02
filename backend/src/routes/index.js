const router = require('express').Router();

router.use('/health', require('../modules/health/health.routes'));
router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/users.routes'));
router.use('/uploads', require('../modules/uploads/uploads.routes')); // Step 3 ✅
router.use('/vendors', require('../modules/vendors/vendors.routes')); // Step 3 ✅
router.use('/categories', require('../modules/categories/categories.routes')); // Step 3 ✅
router.use('/products', require('../modules/products/products.routes')); // Step 3 ✅
router.use('/admin', require('../modules/admin/admin.routes')); // Step 3 ✅ (grows in 6/7)

// Step 5: cart · Step 6: orders · payments · admin/payments
module.exports = router;