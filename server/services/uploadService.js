// server/services/uploadService.js
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

exports.processSingleUpload = async (file) => {
    if (!file) {
        throw new AppError('No file uploaded', 400);
    }

    return {
        url: file.path,
        publicId: file.filename
    };
};

exports.processMultipleUploads = async (files) => {
    if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
    }

    return files.map(file => ({
        url: file.path,
        publicId: file.filename
    }));
};

exports.deleteImage = async (publicId) => {
    if (!publicId) {
        throw new AppError('Public ID required', 400);
    }

    // Call out to Cloudinary to actually delete the file from their servers
    const result = await cloudinary.uploader.destroy(publicId);

    return { message: 'Image deleted successfully', result };
};