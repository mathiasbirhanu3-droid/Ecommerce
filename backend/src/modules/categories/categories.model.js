const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: '' }, // Cloudinary URL
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true }, // self-ref tree
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } } }
);

module.exports = mongoose.model('Category', categorySchema);