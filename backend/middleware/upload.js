const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

// ─── Multer setup: store files in memory, not disk ───────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    try {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

        if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
            console.log(`[Upload] Accepted file: ${file.originalname} (${file.mimetype})`);
            cb(null, true);
        } else {
            console.warn(`[Upload] Rejected file type: ${file.mimetype}`);
            cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
        }
    } catch (error) {
        console.error('[Upload] fileFilter error:', error.message);
        cb(error, false);
    }
};

// Max 5 images (each ≤10MB) + 1 video (≤200MB ≈ 2 min at 720p)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200 MB per file (safety ceiling)
        files: 6, // max 5 images + 1 video in one request
    },
});

// ─── Helper: upload a single buffer to Cloudinary ────────────────────────────
const uploadBufferToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`[Cloudinary Upload] Starting upload to folder: ${options.folder || 'pawsaarthi'}`);

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: options.folder || 'pawsaarthi',
                    resource_type: options.resource_type || 'auto',
                    ...options,
                },
                (error, result) => {
                    if (error) {
                        console.error('[Cloudinary Upload] Upload stream error:', error.message);
                        reject(error);
                    } else {
                        console.log(`[Cloudinary Upload] Success: ${result.secure_url}`);
                        resolve(result);
                    }
                }
            );

            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        } catch (error) {
            console.error('[Cloudinary Upload] Unexpected error:', error.message);
            reject(error);
        }
    });
};

module.exports = { upload, uploadBufferToCloudinary };
