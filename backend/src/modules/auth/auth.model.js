const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSubschema = new mongoose.Schema(
  {
    fullName: { type: String, default: '', maxlength: 80 },
    phone: { type: String, default: '', maxlength: 20 },
    street: { type: String, default: '', maxlength: 120 },
    city: { type: String, default: '', maxlength: 60 },
    state: { type: String, default: '', maxlength: 60 },
    country: { type: String, default: '', maxlength: 60 },
    postalCode: { type: String, default: '', maxlength: 20 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true, // unique index (§7.3)
      lowercase: true,
      trim: true,
    },

    // §3.5: ≥8 chars — regex is enforced by Zod at the boundary; minlength here is defense-in-depth.
    // select:false → a query can NEVER accidentally leak hashes (§11).
    password: { type: String, required: true, minlength: 8, select: false },

    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'], // FR-AUTH-07 — never accepted from client input
      default: 'customer',
    },

    // ADR-27 / FR-AUTH-09: authGuard rejects tokens issued before this moment.
    passwordChangedAt: { type: Date, select: false },

    // G-02: COD fraud seed metric — P2 blocklist threshold reads this.
    codRefusalCount: { type: Number, default: 0, min: 0 },

    // FR-USER-01: single default shipping address in MVP.
    defaultAddress: { type: addressSubschema, default: () => ({}) },

    // FR-AUTH-05: reset token stored HASHED, 10-min TTL. select:false = never leaks.
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash on every password change — and stamp passwordChangedAt so old JWTs die (ADR-27).
// The 1s skew: iat is whole-seconds, so a token minted in the same second as the change
// would otherwise survive the claim check. Classic auth bug — prevented here.
userSchema.pre('save', async function markAndHash(next) {
  if (!this.isModified('password')) return next();
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  this.password = await bcrypt.hash(this.password, 10); // §11: bcrypt-10
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);