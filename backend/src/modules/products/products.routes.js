const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const roleGuard = require('../../middleware/roleGuard');
const vendorGuard = require('../../middleware/vendorGuard');
const controller = require('./products.controller');
const { createSchema, updateSchema, moderateSchema, listQuerySchema, objectId } = require('./products.validation');

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Public listing — search, filters, sort, pagination (FR-SRH-01/02)
 *     parameters:
 *       - in: query; name: search; schema: { type: string }
 *       - in: query; name: category; schema: { type: string }
 *       - in: query; name: vendor; schema: { type: string }
 *       - in: query; name: sort; schema: { type: string, enum: [newest, price, -price] }
 *     responses:
 *       200: { description: Paginated products envelope }
 */
router.get('/', validate(listQuerySchema), controller.list);

router.get('/slug/:slug', validate(require('./products.validation').slugParamSchema), controller.getBySlug);
router.get('/:id/related', validate(require('./products.validation').idParamSchema), controller.related);

router.post('/', authGuard, vendorGuard, validate(createSchema), controller.create);
router.patch('/:id', authGuard, vendorGuard, validate(updateSchema), controller.update);
router.delete('/:id', authGuard, vendorGuard, validate(require('./products.validation').idParamSchema), controller.remove);
router.patch('/:id/moderate', authGuard, roleGuard('admin'), validate(moderateSchema), controller.moderate);

module.exports = router;