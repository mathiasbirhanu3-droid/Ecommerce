const router = require('express').Router();
const authGuard = require('../../middleware/authGuard');
const { uploadSingle } = require('../../middleware/upload');
const { uploadBuffer } = require('../../utils/cloudinary');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

const KINDS = new Set(['logo', 'banner', 'product', 'category']);

// POST /uploads — multipart/form-data { file, kind } → { url }
router.post(
  '/',
  authGuard,
  uploadSingle,
  asyncHandler(async (req, res) => {
    const kind = req.body?.kind;
    if (!kind || !KINDS.has(kind)) throw new AppError('Invalid upload kind', 400);
    if (!req.file) throw new AppError('No file received', 400);

    // Folder is built ONLY from server-known values — never raw client strings.
    const folder = `vendora/${kind}/${req.user._id}`;
    const result = await uploadBuffer(req.file.buffer, folder);

    return sendSuccess(res, {
      status: 201,
      message: 'Image uploaded',
      data: { url: result.secure_url, publicId: result.public_id },
    });
  })
);

module.exports = router;