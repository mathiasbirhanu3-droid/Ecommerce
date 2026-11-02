const jwt = require('jsonwebtoken');
const User = require('./auth.model');
const { env } = require('../../config/env');
const AppError = require('../../utils/AppError');
const { generateRawToken, sha256 } = require('../../utils/cryptoTokens');
const { sendEmail } = require('../../utils/emails/email.service');
const { resetPasswordEmail } = require('../../utils/emails/templates/resetPassword.template');

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

// FR-AUTH-01 — role is NEVER taken from input (model default 'customer' is the only path in).
const registerUser = async ({ name, email, password }) => {
  const exists = await User.findOne({ email }).lean();
  if (exists) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password });
  return user;
};

// No user enumeration: identical error for unknown email AND wrong password (§11).
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  return user;
};

// FR-AUTH-05 — always succeeds from the caller's perspective; silent when unknown email.
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) return { handled: true };

  const rawToken = generateRawToken();
  user.resetPasswordToken = sha256(rawToken); // store hash only (§11)
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10-min TTL (doc)
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  // Fire-and-forget: never blocks, never throws into the request (FR-EML-01).
  sendEmail({ to: user.email, subject: 'Reset your Vendora password', html: resetPasswordEmail(user, resetUrl) });

  // devResetUrl lets us test the full flow without a real inbox — DEV ONLY (never in prod).
  return { handled: true, ...(env.NODE_ENV === 'development' ? { devResetUrl: resetUrl } : {}) };
};

// FR-AUTH-05/06 + ADR-27 — single-use, 10-min, and the save() hook stamps passwordChangedAt,
// which instantly kills every existing session via the authGuard claim check.
const resetPassword = async ({ token, password }) => {
  const user = await User.findOne({
    resetPasswordToken: sha256(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new AppError('This reset link is invalid or has expired', 400);

  user.password = password; // pre-save hook: hashes + passwordChangedAt (with 1s skew)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return user;
};

// FR-AUTH-04 — fresh DB read: role changes & deactivations apply immediately (§5.4 layer 2).
const getSessionUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Session no longer valid — please log in again', 401);
  return user;
};

module.exports = { signToken, registerUser, loginUser, forgotPassword, resetPassword, getSessionUser };