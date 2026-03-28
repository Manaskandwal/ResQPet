const FileType = require('file-type');

/**
 * Validates uploaded media (magic bytes and file size)
 */
const validateMedia = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoMimeTypes = ['video/mp4'];

    try {
        for (const file of req.files) {
            const type = await FileType.fromBuffer(file.buffer);

            if (!type) {
                return res.status(400).json({ success: false, message: `Could not determine file type for ${file.originalname}` });
            }

            const isImage = allowedImageMimeTypes.includes(type.mime);
            const isVideo = allowedVideoMimeTypes.includes(type.mime);

            if (!isImage && !isVideo) {
                return res.status(400).json({ success: false, message: `File type ${type.mime} is not allowed.` });
            }

            if (isImage && file.size > MAX_IMAGE_SIZE) {
                return res.status(400).json({ success: false, message: `Image ${file.originalname} exceeds 5MB limit.` });
            }

            if (isVideo && file.size > MAX_VIDEO_SIZE) {
                return res.status(400).json({ success: false, message: `Video ${file.originalname} exceeds 50MB limit.` });
            }
        }
        next();
    } catch (error) {
        console.error('[validateMedia] Error:', error.message);
        res.status(500).json({ success: false, message: 'Media validation failed.' });
    }
};

module.exports = { validateMedia };
