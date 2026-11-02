const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { setAuthCookie, clearAuthCookie } = require('../../utils/cookies');
const authService = require('./auth.service');

// POST /auth/register — FR-AUTH-01/02: registers AND starts the session (low-friction UX, US-02).
exports.register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.validated.body);
  setAuthCookie(res, authService.signToken(user));
  return sendSuccess(res, { status: 201, message: 'Account created', data: { user } });
});

// POST /auth/login — FR-AUTH-02.
exports.login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.validated.body);
  setAuthCookie(res, authService.signToken(user));
  // Step 5 hook (FR-AUTH-08): client calls POST /cart/merge right after login.
  return sendSuccess(res, { message: 'Logged in', data: { user } });
});

// POST /auth/logout — FR-AUTH-03. Unguarded by design: clearing a stale cookie must always work.
exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, { message: 'Logged out' });
});

// GET /auth/me — FR-AUTH-04.
exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getSessionUser(req.user._id);
  return sendSuccess(res, { message: 'Session active', data: { user } });
});

// POST /auth/forgot-password — FR-AUTH-05. Response is IDENTICAL whether or not the
// email exists → attackers learn nothing (user-enumeration guard, §11).
exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.validated.body);
  return sendSuccess(res, {
    message: 'If an account exists for that email, a reset link has been sent.',
    data: result.devResetUrl ? { devResetUrl: result.devResetUrl } : {},
  });
});

// PATCH /auth/reset-password/:token — FR-AUTH-05/06.
exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({ token: req.validated.params.token, password: req.validated.body.password });
  return sendSuccess(res, { message: 'Password reset — please sign in with your new password' });
});