const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const vendorGuard = require('../../middleware/vendorGuard');
const controller = require('./vendors.controller');
const { applySchema, updateVendorSchema } = require('./vendors.validation');

/**
 * @openapi
 * /vendors/apply:
 *   post:
 *     tags: [Vendors]
 *     summary: Apply to open a store (FR-VEN-01, customer only)
 *     responses:
 *       201: { description: Application created (status pending) }
 *       403: { description: Only customers may apply }
 *       409: { description: Already has a store }
 */
router.post('/apply', authGuard, validate(applySchema), controller.apply);

router.get('/me', authGuard, controller.getMine);                 // literal BEFORE parameterized routes
router.patch('/me', authGuard, vendorGuard, validate(updateVendorSchema), controller.updateMine);
router.get('/me/products', authGuard, vendorGuard, controller.listMyProducts); // FR — vendor's own inventory

const { applySchema, updateVendorSchema, publicSlugSchema } = require('./vendors.validation');
router.get('/slug/:slug', validate(publicSlugSchema), controller.getPublicBySlug);


module.exports = router;