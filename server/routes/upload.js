const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    uploadImage,
    uploadMultiple,
    deleteImage
} = require('../controllers/uploadController');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/single', auth, upload.single('image'), uploadImage);
router.post('/multiple', auth, isAdmin, upload.array('images', 5), uploadMultiple);
router.delete('/', auth, isAdmin, deleteImage);

module.exports = router;