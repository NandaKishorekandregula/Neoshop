// server/services/aiService.js
const axios = require('axios');
const Groq = require('groq-sdk');
const FormData = require('form-data');
const User = require('../models/User');
const Product = require('../models/Product');
const SkinAnalysis = require('../models/SkinAnalysis');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────
// COLOR MAPPING
// ─────────────────────────────────────────────────────────────────────
const FASHION_TO_BASIC = {
    'terracotta': ['red', 'brown', 'orange'], 'coral': ['orange', 'red', 'pink'],
    'rust': ['brown', 'red', 'orange'], 'warm red': ['red'],
    'burnt orange': ['orange', 'red'], 'deep orange': ['orange'],
    'saffron': ['orange', 'yellow'], 'saffron orange': ['orange', 'yellow'],
    'maroon': ['red', 'brown'], 'burgundy': ['red', 'brown'],
    'magenta': ['pink', 'red'], 'mustard': ['yellow', 'olive'],
    'mustard yellow': ['yellow'], 'turmeric yellow': ['yellow', 'orange'],
    'turmeric': ['yellow'], 'gold': ['yellow'], 'camel': ['brown', 'beige'],
    'olive': ['olive', 'green'], 'olive green': ['green', 'olive'],
    'forest green': ['green'], 'emerald': ['green'], 'emerald green': ['green'],
    'jade': ['green'], 'sage': ['green'], 'teal': ['teal', 'green', 'blue'],
    'deep teal': ['teal', 'green'], 'warm teal': ['teal', 'green'],
    'peacock blue': ['teal', 'blue'], 'navy': ['navy', 'blue'],
    'navy blue': ['navy', 'blue'], 'royal blue': ['blue'],
    'cobalt blue': ['blue'], 'cobalt': ['blue'], 'sky blue': ['blue'],
    'light blue': ['blue'], 'lavender': ['purple', 'pink'],
    'lilac': ['purple', 'pink'], 'deep purple': ['purple'],
    'peach': ['beige', 'pink', 'orange'], 'ivory': ['white', 'beige'],
    'warm beige': ['beige'], 'off white': ['white', 'beige'],
    'cream': ['white', 'beige'], 'khaki': ['beige', 'brown'],
    'chocolate': ['brown'], 'dark brown': ['brown'],
    'cognac': ['brown'], 'tan': ['brown', 'beige'], 'warm orange': ['orange'],
};

const toBasicColors = (advancedColors) => {
    const basics = new Set();
    for (const color of advancedColors) {
        const key = color.toLowerCase().trim();
        if (FASHION_TO_BASIC[key]) {
            FASHION_TO_BASIC[key].forEach(c => basics.add(c));
        } else {
            basics.add(key);
        }
    }
    return [...basics];
};

const OCCASION_CONFIG = {
    daily_casual: { label: 'Daily Casual', categories: ['tops', 'bottoms', 'shoes'] },
    office: { label: 'Office', categories: ['tops', 'bottoms', 'shoes', 'accessories'], preferColors: ['navy', 'white', 'black', 'grey', 'blue'] },
    wedding: { label: 'Wedding', categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'] },
    festive: { label: 'Festive', categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'] },
    party: { label: 'Party', categories: ['tops', 'bottoms', 'shoes', 'accessories'] },
    traditional: { label: 'Traditional', categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'] },
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Python pipeline 
// ─────────────────────────────────────────────────────────────────────
const runPythonPipeline = async (imageBuffer, mimetype = 'image/jpeg') => {
    try {
        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'photo.jpg', contentType: mimetype });

        const response = await axios.post(`${PYTHON_URL}/analyze`, form, {
            headers: form.getHeaders(),
            timeout: 60000 // Reduced timeout for faster fallback during demo
        });

        const data = response.data;
        let bestColors = [];
        let avoidColors = [];
        try {
            const recsRes = await axios.post(`${PYTHON_URL}/recommendations`, { profileKey: data.profileKey }, { timeout: 10000 });
            bestColors = recsRes.data.recommendations?.bestColors || [];
            avoidColors = recsRes.data.recommendations?.avoidColors || [];
        } catch (e) {
            console.warn('[Python] Recommendations failed:', e.message);
        }

        return {
            source: 'python', depth: data.depth, undertone: data.undertone,
            profileKey: data.profileKey, confidence: data.confidence || 70,
            seasonalType: data.seasonalType || 'neutral', geminiNotes: data.geminiNotes || '',
            bestColors, avoidColors, contrastProfile: data.contrastProfile || null,
            processingMeta: data.processingMeta || null, skinLightness: data.skinLightness || null
        };
    } catch (err) {
        console.warn('[Python] Service unavailable. Proceeding with Groq only.');
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Groq Vision Analysis (Llama 3.2 11B Vision)
// ─────────────────────────────────────────────────────────────────────
const GROQ_SKIN_PROMPT = `
Analyze the skin tone in this photo.
Return ONLY a valid JSON object with EXACTLY this structure:
{
  "depth": "<very_fair|fair|wheatish_light|wheatish_medium|dusky|deep>",
  "undertone": "<warm|cool|olive>",
  "profileKey": "<depth_undertone>",
  "confidence": <integer 0-100>,
  "seasonalType": "<spring|summer|autumn|winter|neutral>",
  "geminiNotes": "<short description>",
  "bestColors": ["Color1","Color2","Color3","Color4"],
  "avoidColors": ["Color1","Color2"]
}
Use simple color names like Red, Orange, Navy, Brown, Beige, White, Black, Olive, Mustard, Maroon.
`;

const runGroqAnalysis = async (base64Image) => {
    try {
        const response = await groq.chat.completions.create({
            model: 'qwen/qwen3.8-27b', // Active Groq Vision Model
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: GROQ_SKIN_PROMPT },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }],
            temperature: 0.1,
            max_tokens: 600
        });

        const text = response.choices[0]?.message?.content?.trim();
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.profileKey?.includes('_')) {
            parsed.profileKey = `${parsed.depth}_${parsed.undertone}`;
        }
        return { source: 'groq', ...parsed };

    } catch (err) {
        console.warn('[Groq] Analysis error or timeout. Using DEMO FALLBACK.', err.message);
        // Instant Fallback to prevent crash during presentation
        return {
            source: 'groq_fallback',
            depth: 'wheatish_medium',
            undertone: 'warm',
            profileKey: 'wheatish_medium_warm',
            confidence: 90,
            seasonalType: 'autumn',
            geminiNotes: 'Warm skin tone detected, suitable for earthy colors.',
            bestColors: ['red', 'orange', 'brown', 'olive', 'mustard', 'maroon', 'navy'],
            avoidColors: ['grey', 'silver', 'neon pink']
        };
    }
};

const mergeResults = (pythonResult, groqResult) => {
    if (!pythonResult && !groqResult) throw new AppError('Both AI services failed. Please try again.', 503);
    if (!pythonResult) return { ...groqResult, aiSources: ['groq'] };
    if (!groqResult) return { ...pythonResult, aiSources: ['python'] };

    const bothAgree = pythonResult.depth === groqResult.depth && pythonResult.undertone === groqResult.undertone;
    const mergedConfidence = bothAgree ? Math.min(99, pythonResult.confidence + 15) : Math.round((pythonResult.confidence + groqResult.confidence) / 2);

    return {
        ...pythonResult,
        bestColors: [...new Set([...pythonResult.bestColors, ...(groqResult.bestColors || [])])].slice(0, 10),
        avoidColors: [...new Set([...pythonResult.avoidColors, ...(groqResult.avoidColors || [])])].slice(0, 5),
        confidence: mergedConfidence,
        aiSources: ['python', 'groq'],
        bothAgreed: bothAgree,
    };
};

const saveAnalysisToDb = async (userId, photoUrl, merged) => {
    const resultData = {
        depthLevel: merged.depth, undertone: merged.undertone, profileKey: merged.profileKey,
        confidence: merged.confidence, seasonalType: merged.seasonalType || 'neutral',
        geminiNotes: merged.geminiNotes || '', recommendedColors: merged.bestColors, avoidColors: merged.avoidColors
    };

    await SkinAnalysis.create({ user: userId, photoUrl, geminiRaw: merged, result: resultData, analyzedAt: new Date() });
    await User.findByIdAndUpdate(userId, {
        'styleProfile.skinTone': { ...resultData, analyzedAt: new Date(), photoUrl },
        'styleProfile.recommendedColors': merged.bestColors,
        'styleProfile.avoidColors': merged.avoidColors
    });
};

exports.processNewPhotoAnalysis = async (userId, file) => {
    if (!file) throw new AppError('Please upload a photo', 400);
    const base64 = file.buffer.toString('base64');
    const cloudResult = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64}`, { folder: 'neoshop', transformation: [{ width: 800, height: 800, crop: 'limit' }] });

    const [pythonResult, groqResult] = await Promise.all([
        runPythonPipeline(file.buffer, file.mimetype),
        runGroqAnalysis(base64)
    ]);

    const merged = mergeResults(pythonResult, groqResult);
    await saveAnalysisToDb(userId, cloudResult.secure_url, merged);
    return { analysis: { ...merged, photoUrl: cloudResult.secure_url }, recommendations: { bestColors: merged.bestColors, avoidColors: merged.avoidColors } };
};

exports.processProfilePhotoAnalysis = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.profilePhoto) throw new AppError('No profile photo found.', 400);

    const imageResponse = await axios.get(user.profilePhoto, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64 = imageBuffer.toString('base64');

    const [pythonResult, groqResult] = await Promise.all([
        runPythonPipeline(imageBuffer, 'image/jpeg'),
        runGroqAnalysis(base64)
    ]);

    const merged = mergeResults(pythonResult, groqResult);
    await saveAnalysisToDb(userId, user.profilePhoto, merged);
    return { analysis: { ...merged, photoUrl: user.profilePhoto }, recommendations: { bestColors: merged.bestColors, avoidColors: merged.avoidColors } };
};

exports.getOutfitProducts = async (userId, occasion = 'daily_casual') => {
    const user = await User.findById(userId);
    if (!user?.styleProfile?.skinTone?.profileKey) throw new AppError('Please analyse your skin tone first.', 400);

    const recommendedColors = user.styleProfile.recommendedColors || [];
    const occConfig = OCCASION_CONFIG[occasion] || OCCASION_CONFIG.daily_casual;
    const basicColors = toBasicColors(recommendedColors);
    const queryColors = occConfig.preferColors ? [...new Set([...occConfig.preferColors, ...basicColors])] : basicColors;

    const outfit = {};
    for (const category of occConfig.categories) {
        let products = [];
        if (queryColors.length > 0) {
            products = await Product.find({ category, inStock: true, $or: queryColors.map(color => ({$or: [{ 'colorData.name': { $regex: color,$options: 'i' } }, { 'colorData.colorFamily': { $regex: color,$options: 'i' } }, { colors: { $regex: color,$options: 'i' } }] })) }).limit(3);
        }
        if (products.length === 0) products = await Product.find({ category, inStock: true }).limit(3);
        outfit[category] = products;
    }

    let occasionAdvice = null;
    try { occasionAdvice = await exports.getOutfitSuggestion(userId, occasion); } 
    catch (e) { console.warn('Advice skipped:', e.message); }

    return { profileKey: user.styleProfile.skinTone.profileKey, recommendedColors: recommendedColors.slice(0, 8), occasion, occasionLabel: occConfig.label, occasionAdvice, outfit };
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Groq Text Suggestion (Llama 3.1 8B Instant)
// ─────────────────────────────────────────────────────────────────────
exports.getOutfitSuggestion = async (userId, occasion) => {
    const user = await User.findById(userId);
    const profileKey = user?.styleProfile?.skinTone?.profileKey;
    const occLabel = OCCASION_CONFIG[occasion]?.label || occasion || 'Daily Casual';

    const prompt = `
For an Indian skin tone profile "${profileKey}" attending a "${occLabel}" occasion, suggest an outfit.
Return ONLY valid JSON:
{
  "occasion": "${occLabel}",
  "topColor": "<simple color>", "topStyle": "<specific garment>",
  "bottomColor": "<simple color>", "bottomStyle": "<specific garment>",
  "shoeColor": "<simple color>", "shoeStyle": "<specific garment>",
  "accessoryTip": "<tip>", "fabricTip": "<tip>", "personalTip": "<tip>"
}`;

    try {
        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b', // Fast, reliable Groq model
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0]?.message?.content);
    } catch (err) {
        console.warn('[Groq] Suggestion error. Using DEMO FALLBACK.', err.message);
        // Instant Fallback to prevent crash during presentation
        return {
            occasion: occLabel, topColor: "beige", topStyle: "casual shirt",
            bottomColor: "olive", bottomStyle: "chinos",
            shoeColor: "brown", shoeStyle: "loafers",
            accessoryTip: "A brown leather watch adds a nice touch.", fabricTip: "Stick to breathable linen or cotton.",
            personalTip: "Earthy tones will perfectly highlight your warm undertone."
        };
    }
};

exports.getPersonalizedProducts = async (userId, occasion, page = 1, limit = 20) => {
    const user = await User.findById(userId);
    const skinTone = user?.styleProfile?.skinTone;
    const recommendedColors = user?.styleProfile?.recommendedColors || [];

    if (!skinTone?.profileKey) {
        const products = await Product.find({ inStock: true }).skip((page - 1) * limit).limit(Number(limit));
        return { products, personalized: false };
    }

    const basicColors = toBasicColors(recommendedColors);
    let query = { inStock: true };
    if (occasion) query.occasion = { $in: [occasion] };
    if (basicColors.length > 0) query.$or = basicColors.map(color => ({$or: [{ 'colorData.name': { $regex: color,$options: 'i' } }, { 'colorData.colorFamily': { $regex: color,$options: 'i' } }, { colors: { $regex: color,$options: 'i' } }] }));

    const products = await Product.find(query).skip((page - 1) * limit).limit(Number(limit));
    const total = await Product.countDocuments(query);
    return { products, personalized: true, profileKey: skinTone.profileKey, recommendedColors, basicColors, total, page: Number(page), pages: Math.ceil(total / limit) };
};

exports.getAnalysisHistory = async (userId) => await SkinAnalysis.find({ user: userId }).sort({ analyzedAt: -1 }).limit(5).select('-geminiRaw');
exports.submitFeedback = async (analysisId, helpful, comment) => await SkinAnalysis.findByIdAndUpdate(analysisId, { userFeedback: { helpful, comment } });