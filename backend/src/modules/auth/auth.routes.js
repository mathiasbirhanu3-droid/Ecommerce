const router = require('express').Router();
const { validate } = require('../../middleware/validate');
const authGuard = require('../../middleware/authGuard');
const controller = require('./auth.controller');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a customer and start a session (FR-AUTH-01/02)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Sara Bekele" }
 *               email: { type: string, format: email, example: "sara@example.com" }
 *               password: { type: string, example: "Str0ngPass" }
 *     responses:
 *       201: { description: Account created (session cookie set) }
 *       409: { description: Email already registered }
 */
router.post('/register', validate(registerSchema), controller.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in (sets httpOnly JWT cookie) (FR-AUTH-02)
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Invalid email or password }
 */
router.post('/login', validate(loginSchema), controller.login);
router.post('/logout', controller.logout); // FR-AUTH-03
router.get('/me', authGuard, controller.me); // FR-AUTH-04
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword); // FR-AUTH-05
router.patch('/reset-password/:token', validate(resetPasswordSchema), controller.resetPassword); // FR-AUTH-05/06

module.exports = router;