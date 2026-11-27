const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Store in a temporary uploads folder; Cloudinary will be the final destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|gif|webp)$/i;
  const allowedMime = /^image\/(jpeg|jpg|png|gif|webp)$/i;
  const extname = allowedExt.test(path.extname(file.originalname));
  const mimetype = allowedMime.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

/**
 * Inspect magic bytes of uploaded file on disk to reject spoofed extensions.
 */
const verifyImageSignature = (filePath) => {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isGif = buf.slice(0, 3).toString('ascii') === 'GIF';
    const isWebp = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';

    return isJpeg || isPng || isGif || isWebp;
  } catch {
    return false;
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 12 }, // 8 MB per file, max 12 files
});

module.exports = upload;
module.exports.verifyImageSignature = verifyImageSignature;
