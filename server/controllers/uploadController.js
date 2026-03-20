const cloudinary = require('../config/cloudinary');

// Upload single image
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            url: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload multiple images
exports.uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const urls = req.files.map(file => ({
            url: file.path,
            publicId: file.filename
        }));

        res.json({ images: urls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete image
exports.deleteImage = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ error: 'Public ID required' });
        }

        const result = await cloudinary.uploader.destroy(publicId);

        res.json({ message: 'Image deleted', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};