const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const roleGuard = require('../../middleware/roleGuard');
const controller = require('./categories.controller');
const { createSchema, updateSchema, idParamSchema } = require('./categories.validation');

router.get('/', controller.list);        // public
router.get('/tree', controller.tree);    // public — MegaMenu consumes this in Step 4
router.post('/', authGuard, roleGuard('admin'), validate(createSchema), controller.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updateSchema), controller.update);
router.delete('/:id', authGuard, roleGuard('admin'), validate(idParamSchema), controller.remove); // FR-CAT-03

module.exports = router;