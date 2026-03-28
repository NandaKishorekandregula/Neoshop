// server/controllers/aiController.js
const aiService = require('../services/aiService');
const catchAsync = require('../utils/catchAsync');

exports.analyzeSkinTone = catchAsync(async (req, res) => {
    const { analysis, recommendations } = await aiService.processNewPhotoAnalysis(req.user.id, req.file);
    res.json({ success: true, analysis, recommendations });
});

exports.analyzeFromProfile = catchAsync(async (req, res) => {
    const { analysis, recommendations } = await aiService.processProfilePhotoAnalysis(req.user.id);
    res.json({ success: true, analysis, recommendations });
});

// NOW accepts ?occasion=wedding so tabs actually filter products
exports.getOutfitProducts = catchAsync(async (req, res) => {
    const occasion = req.query.occasion || 'daily_casual';
    const data = await aiService.getOutfitProducts(req.user.id, occasion);
    res.json({ success: true, ...data });
});

exports.getOutfitSuggestion = catchAsync(async (req, res) => {
    const { occasion } = req.body;
    const outfit = await aiService.getOutfitSuggestion(req.user.id, occasion);
    res.json({ success: true, outfit });
});

exports.getPersonalizedProducts = catchAsync(async (req, res) => {
    const { occasion, page, limit } = req.query;
    const data = await aiService.getPersonalizedProducts(req.user.id, occasion, page, limit);
    res.json(data);
});

exports.getAnalysisHistory = catchAsync(async (req, res) => {
    const history = await aiService.getAnalysisHistory(req.user.id);
    res.json({ success: true, history });
});

exports.submitFeedback = catchAsync(async (req, res) => {
    const { analysisId, helpful, comment } = req.body;
    await aiService.submitFeedback(analysisId, helpful, comment);
    res.json({ success: true, message: 'Feedback saved. Thank you!' });
});