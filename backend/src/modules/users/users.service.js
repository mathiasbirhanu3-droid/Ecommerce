const User = require('../auth/auth.model');
const AppError = require('../../utils/AppError');

const updateProfile = async (userId, { name }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.name = name; // email is immutable in MVP (avoids re-verification flows) — documented decision
  await user.save();
  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }
  user.password = newPassword; // pre-save hook hashes + stamps passwordChangedAt → all sessions die (ADR-27)
  await user.save();
  return user;
};

const updateAddress = async (userId, address) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.defaultAddress = address;
  await user.save();
  return user;
};

module.exports = { updateProfile, changePassword, updateAddress };