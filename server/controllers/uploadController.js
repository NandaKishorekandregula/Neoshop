// server/controllers/uploadController.js
const uploadService = require('../services/uploadService');
const catchAsync = require('../utils/catchAsync');

// Upload single image
exports.uploadImage = catchAsync(async (req, res) => {
    // req.file is populated by your multer middleware before this runs
    const imageData = await uploadService.processSingleUpload(req.file);
    res.json(imageData);
});

// Upload multiple images
exports.uploadMultiple = catchAsync(async (req, res) => {
    // req.files is populated by multer
    const imagesData = await uploadService.processMultipleUploads(req.files);
    res.json({ images: imagesData });
});

// Delete image
exports.deleteImage = catchAsync(async (req, res) => {
    const result = await uploadService.deleteImage(req.body.publicId);
    res.json(result);
});