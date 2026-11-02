const { v2: cloudinary } = require('cloudinary');
const { env } = require('../config/env');
const AppError = require('./AppError');

let configured = false;
const configure = () => {
  if (configured) return true;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
};

/**
 * Uploads a Multer memory buffer. folder is pre-whitelisted by the route
 * (e.g. `vendora/products/<userId>`) — never built from raw client input.
 * eager fetch_format:auto → Cloudinary serves WebP to supporting browsers (NFR-01).
 */
const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    if (!configure()) return reject(new AppError('Image storage is not configured on the server', 503));
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        eager: [{ fetch_format: 'auto', quality: 'auto' }],
        eager_async: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer); // no streamifier needed — Writable.end(Buffer) is enough
    return undefined;
  });

module.exports = { uploadBuffer };