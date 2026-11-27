const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const { verifyImageSignature } = require('../config/multer');

const safeUnlink = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors on temp files
    }
  }
};

/**
 * Validate uploaded image bytes and upload to Cloudinary cropped to exact fixed dimensions.
 */
const uploadFixedImage = async (file, { folder, width, height, gravity = 'auto' }) => {
  if (!file) return null;

  if (!verifyImageSignature(file.path)) {
    safeUnlink(file.path);
    const err = new Error('Invalid image file signature. Only JPEG, PNG, GIF, or WebP images are allowed.');
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      transformation: [
        {
          width,
          height,
          crop: 'fill',
          gravity,
          fetch_format: 'auto',
          quality: 'auto:good',
        },
      ],
    });

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id,
    };
  } finally {
    safeUnlink(file.path);
  }
};

const destroyCloudinaryAssets = async (publicIds = []) => {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];
  await Promise.allSettled(
    uniqueIds.map((id) => cloudinary.uploader.destroy(id))
  );
};

module.exports = { uploadFixedImage, destroyCloudinaryAssets, safeUnlink };
