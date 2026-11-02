const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const controller = require('./users.controller');
const { updateProfileSchema, changePasswordSchema, updateAddressSchema } = require('./users.validation');

// All user-profile routes require a session (authGuard = layer 2, §5.4).
router.patch('/me', authGuard, validate(updateProfileSchema), controller.updateProfile);
router.patch('/me/password', authGuard, validate(changePasswordSchema), controller.changePassword);
router.patch('/me/address', authGuard, validate(updateAddressSchema), controller.updateAddress);

module.exports = router;