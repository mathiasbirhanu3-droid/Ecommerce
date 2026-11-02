const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const usersService = require('./users.service');

// PATCH /users/me — FR-USER-01
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user._id, req.validated.body);
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

// PATCH /users/me/password — FR-USER-01 + ADR-27: client MUST re-login afterwards.
exports.changePassword = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user._id, req.validated.body);
  return sendSuccess(res, { message: 'Password changed — please sign in again' });
});

// PATCH /users/me/address — FR-USER-01
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await usersService.updateAddress(req.user._id, req.validated.body);
  return sendSuccess(res, { message: 'Address saved', data: { user } });
});