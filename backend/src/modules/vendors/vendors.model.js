const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // FR-VEN-03
    storeName: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true }, // /store/[slug] key (FR-VEN-05)
    logo: { type: String, default: '' },     // Cloudinary URL
    banner: { type: String, default: '' },   // Cloudinary URL
    description: { type: String, default: '', maxlength: 2000 },

    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'], // FR-VEN-02 — only 'approved' is public/sellable
      default: 'pending',
      index: true,
    },

    // Money = integer cents (ADR-07)
    shippingFee: { type: Number, default: 0, min: 0 },               // flat, per sub-order (FR-CHK-02)
    freeShippingOver: { type: Number, default: null, min: 0 },       // null = no free shipping

    commissionRate: { type: Number, default: 0, min: 0, max: 100 },  // % — recorded day one for P3 (§2.3)
  },
  { timestamps: true, toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } } }
);

module.exports = mongoose.model('Vendor', vendorSchema);