// server/routes/ai.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
    analyzeSkinTone,
    analyzeFromProfile,
    getOutfitSuggestion,
    getOutfitProducts,
    getPersonalizedProducts,
    getAnalysisHistory,
    submitFeedback
} = require('../controllers/aiController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// Original upload route (kept for backwards compatibility)
router.post('/analyze', auth, upload.single('photo'), analyzeSkinTone);

// NEW: Analyze using the user's existing profile photo
router.post('/analyze-profile', auth, analyzeFromProfile);

// NEW: Get real products from DB grouped as outfits
router.get('/outfit-products', auth, getOutfitProducts);

// Existing routes
router.post('/outfit', auth, getOutfitSuggestion);
router.get('/products', auth, getPersonalizedProducts);
router.get('/history', auth, getAnalysisHistory);
router.post('/feedback', auth, submitFeedback);

module.exports = router;