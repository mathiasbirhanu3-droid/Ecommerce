const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const roleGuard = require('../../middleware/roleGuard');
const controller = require('./admin.controller');
const { setStatusSchema, listQuerySchema } = require('../vendors/vendors.validation');
const { idParamSchema } = require('../products/products.validation');

router.use(authGuard, roleGuard('admin')); // every /admin route is guarded at mount — nothing slips through

router.get('/stats', controller.stats);
router.get('/vendors', validate(listQuerySchema), controller.listVendors);
router.patch('/vendors/:id/status', validate(idParamSchema), validate(setStatusSchema), controller.setVendorStatus);
// Step 6/7: /admin/orders, /admin/users, /admin/payments (v1.2), /admin/categories reuse

module.exports = router;