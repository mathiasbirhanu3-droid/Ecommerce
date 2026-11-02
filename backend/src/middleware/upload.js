const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap (§12 uploads policy)
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG or WebP images are allowed'));
    }
    return cb(null, true);
  },
});

/**
 * Wraps multer so its errors become proper AppErrors (multer errors would otherwise
 * fall through to a generic 500). Usage: router.post('/x', authGuard, uploadSingle, ctrl).
 */
const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Image exceeds the 5MB limit', 413));
    return next(new AppError(err.message || 'Upload failed', 400));
  });
};

module.exports = { uploadSingle };