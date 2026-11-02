const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, alt: { type: String, required: true, minlength: 3, maxlength: 120 } },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  { name: { type: String, required: true, maxlength: 30 }, values: { type: [String], required: true } }, // ADR-17
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    // ADR-07 — integer cents, ALWAYS
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: null, min: 0 },

    images: { type: [imageSchema], validate: [(v) => v.length <= 5, 'Max 5 images'] }, // FR-PRD-07
    options: { type: [optionSchema], default: [] }, // selectable labels only (ADR-17)

    stock: { type: Number, required: true, min: 0, default: 0 },
    sold: { type: Number, default: 0, min: 0 },     // social proof + related-products ranking (FR-PRD-06)

    avgRating: { type: Number, default: 0, min: 0, max: 5 }, // populated in P2
    numReviews: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true }, // ADR-11 soft delete
  },
  { timestamps: true, toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } } }
);

// §7.3 index strategy — compound indexes match our hottest queries exactly
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ vendor: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' }); // MVP search (ADR-14) — ONE text index per collection

module.exports = mongoose.model('Product', productSchema);