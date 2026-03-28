// server/services/aiService.js
const axios = require('axios');
const Groq = require('groq-sdk');
const FormData = require('form-data');
const User = require('../models/User');
const Product = require('../models/Product');
const SkinAnalysis = require('../models/SkinAnalysis');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────
// COLOR MAPPING: Advanced fashion colors → basic ecommerce colors
// Products in DB will have "red", "blue", "brown" — not "Terracotta"
// ─────────────────────────────────────────────────────────────────────
const FASHION_TO_BASIC = {
    'terracotta': ['red', 'brown', 'orange'],
    'coral': ['orange', 'red', 'pink'],
    'rust': ['brown', 'red', 'orange'],
    'warm red': ['red'],
    'burnt orange': ['orange', 'red'],
    'deep orange': ['orange'],
    'saffron': ['orange', 'yellow'],
    'saffron orange': ['orange', 'yellow'],
    'maroon': ['red', 'brown'],
    'burgundy': ['red', 'brown'],
    'magenta': ['pink', 'red'],
    'mustard': ['yellow', 'olive'],
    'mustard yellow': ['yellow'],
    'turmeric yellow': ['yellow', 'orange'],
    'turmeric': ['yellow'],
    'gold': ['yellow'],
    'camel': ['brown', 'beige'],
    'olive': ['olive', 'green'],
    'olive green': ['green', 'olive'],
    'forest green': ['green'],
    'emerald': ['green'],
    'emerald green': ['green'],
    'jade': ['green'],
    'sage': ['green'],
    'teal': ['teal', 'green', 'blue'],
    'deep teal': ['teal', 'green'],
    'warm teal': ['teal', 'green'],
    'peacock blue': ['teal', 'blue'],
    'navy': ['navy', 'blue'],
    'navy blue': ['navy', 'blue'],
    'royal blue': ['blue'],
    'cobalt blue': ['blue'],
    'cobalt': ['blue'],
    'sky blue': ['blue'],
    'light blue': ['blue'],
    'lavender': ['purple', 'pink'],
    'lilac': ['purple', 'pink'],
    'deep purple': ['purple'],
    'peach': ['beige', 'pink', 'orange'],
    'ivory': ['white', 'beige'],
    'warm beige': ['beige'],
    'off white': ['white', 'beige'],
    'cream': ['white', 'beige'],
    'khaki': ['beige', 'brown'],
    'chocolate': ['brown'],
    'dark brown': ['brown'],
    'cognac': ['brown'],
    'tan': ['brown', 'beige'],
    'warm orange': ['orange'],
};

const toBasicColors = (advancedColors) => {
    const basics = new Set();
    for (const color of advancedColors) {
        const key = color.toLowerCase().trim();
        if (FASHION_TO_BASIC[key]) {
            FASHION_TO_BASIC[key].forEach(c => basics.add(c));
        } else {
            basics.add(key); // already basic
        }
    }
    return [...basics];
};

// Occasion config — which categories to show + any preferred neutral colors
const OCCASION_CONFIG = {
    daily_casual: {
        label: 'Daily Casual',
        categories: ['tops', 'bottoms', 'shoes'],
    },
    office: {
        label: 'Office',
        categories: ['tops', 'bottoms', 'shoes', 'accessories'],
        preferColors: ['navy', 'white', 'black', 'grey', 'gray', 'blue'],
    },
    wedding: {
        label: 'Wedding',
        categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'],
    },
    festive: {
        label: 'Festive',
        categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'],
    },
    party: {
        label: 'Party',
        categories: ['tops', 'bottoms', 'shoes', 'accessories'],
    },
    traditional: {
        label: 'Traditional',
        categories: ['tops', 'bottoms', 'shoes', 'accessories', 'dresses'],
    },
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Python pipeline (lighting fix + MediaPipe + Gemini)
// ─────────────────────────────────────────────────────────────────────
const runPythonPipeline = async (imageBuffer, mimetype = 'image/jpeg') => {
    try {
        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'photo.jpg', contentType: mimetype });

        const response = await axios.post(`${PYTHON_URL}/analyze`, form, {
            headers: form.getHeaders(),
            timeout: 45000
        });

        const data = response.data;

        let bestColors = [];
        let avoidColors = [];
        try {
            const recsRes = await axios.post(
                `${PYTHON_URL}/recommendations`,
                { profileKey: data.profileKey },
                { timeout: 10000 }
            );
            bestColors = recsRes.data.recommendations?.bestColors || [];
            avoidColors = recsRes.data.recommendations?.avoidColors || [];
        } catch (e) {
            console.warn('[Python] Recommendations fetch failed:', e.message);
        }

        return {
            source: 'python',
            depth: data.depth,
            undertone: data.undertone,
            profileKey: data.profileKey,
            confidence: data.confidence || 70,
            seasonalType: data.seasonalType || 'neutral',
            geminiNotes: data.geminiNotes || '',
            bestColors,
            avoidColors,
            contrastProfile: data.contrastProfile || null,
            processingMeta: data.processingMeta || null,
            skinLightness: data.skinLightness || null
        };
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.warn('[Python] Service not running — Groq fallback active');
        } else {
            console.warn('[Python] Error:', err.message);
        }
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Groq vision — second opinion + extra color suggestions
// ─────────────────────────────────────────────────────────────────────
const GROQ_SKIN_PROMPT = `
You are an expert in South Asian / Indian skin tone analysis for fashion.
Analyze the skin tone in this photo carefully.

Return ONLY a valid JSON object with EXACTLY this structure.
No markdown, no explanation, just the raw JSON:

{
  "depth": "<one of: very_fair | fair | wheatish_light | wheatish_medium | dusky | deep>",
  "undertone": "<one of: warm | cool | olive>",
  "profileKey": "<depth_undertone e.g. wheatish_medium_warm>",
  "confidence": <integer 0-100>,
  "seasonalType": "<one of: spring | summer | autumn | winter | neutral>",
  "geminiNotes": "<one sentence describing this specific skin tone>",
  "bestColors": ["Color1","Color2","Color3","Color4","Color5","Color6","Color7","Color8"],
  "avoidColors": ["Color1","Color2","Color3","Color4"]
}

Depth guidelines for Indian skin:
- very_fair: Lightest tone (Kashmir, Punjab)
- fair: Light with warmth (North India)
- wheatish_light: Light golden wheat (UP, Rajasthan)
- wheatish_medium: Most common Indian tone (Pan-India)
- dusky: Deeper tone (South India, Bengal)
- deep: Richest tone (Tamil Nadu, Kerala)

Undertone: warm=golden/yellow | cool=pink/red | olive=greenish/muted

IMPORTANT: For bestColors and avoidColors, use SIMPLE color names that
clothing stores actually use on labels:
Good: Red, Orange, Yellow, Green, Blue, Navy, Brown, Beige, White, Black,
      Grey, Pink, Purple, Olive, Teal, Coral, Maroon, Mustard, Rust
Bad: Terracotta, Turmeric Yellow, Cobalt Blue, Burnt Sienna (too specific)

profileKey MUST be exactly depth_undertone (e.g. "wheatish_medium_warm").
`;

const runGroqAnalysis = async (base64Image) => {
    try {
        const response = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
                role: 'user',
                content: [
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                    { type: 'text', text: GROQ_SKIN_PROMPT }
                ]
            }],
            temperature: 0.1,
            max_tokens: 600
        });

        const text = response.choices[0]?.message?.content?.trim();
        if (!text) throw new Error('Empty response from Groq');

        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const required = ['depth', 'undertone', 'profileKey', 'confidence', 'bestColors', 'avoidColors'];
        for (const field of required) {
            if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
        }

        if (!Array.isArray(parsed.bestColors)) parsed.bestColors = [];
        if (!Array.isArray(parsed.avoidColors)) parsed.avoidColors = [];
        if (!parsed.profileKey?.includes('_')) {
            parsed.profileKey = `${parsed.depth}_${parsed.undertone}`;
        }

        return { source: 'groq', ...parsed };
    } catch (err) {
        console.warn('[Groq] Analysis error:', err.message);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Merge Python + Groq — Python wins on science, Groq adds colors
// ─────────────────────────────────────────────────────────────────────
const mergeResults = (pythonResult, groqResult) => {
    if (!pythonResult && !groqResult) {
        throw new AppError('Both AI services failed. Please try again.', 503);
    }
    if (!pythonResult) return { ...groqResult, aiSources: ['groq'] };
    if (!groqResult) return { ...pythonResult, aiSources: ['python'] };

    const bothAgree = pythonResult.depth === groqResult.depth &&
        pythonResult.undertone === groqResult.undertone;

    if (!bothAgree) {
        console.log(`[Merge] Python: ${pythonResult.profileKey} vs Groq: ${groqResult.profileKey} — Python wins`);
    }

    const mergedConfidence = bothAgree
        ? Math.min(99, pythonResult.confidence + 15)
        : Math.round((pythonResult.confidence + groqResult.confidence) / 2);

    const combinedBestColors = [
        ...pythonResult.bestColors,
        ...groqResult.bestColors.filter(c => !pythonResult.bestColors.includes(c))
    ].slice(0, 12);

    const combinedAvoidColors = [
        ...pythonResult.avoidColors,
        ...groqResult.avoidColors.filter(c => !pythonResult.avoidColors.includes(c))
    ].slice(0, 6);

    return {
        depth: pythonResult.depth,
        undertone: pythonResult.undertone,
        profileKey: pythonResult.profileKey,
        seasonalType: pythonResult.seasonalType || groqResult.seasonalType,
        geminiNotes: pythonResult.geminiNotes || groqResult.geminiNotes,
        contrastProfile: pythonResult.contrastProfile || null,
        processingMeta: pythonResult.processingMeta || null,
        skinLightness: pythonResult.skinLightness || null,
        bestColors: combinedBestColors,
        avoidColors: combinedAvoidColors,
        confidence: mergedConfidence,
        aiSources: ['python', 'groq'],
        bothAgreed: bothAgree,
        groqProfileKey: groqResult.profileKey
    };
};

// ─────────────────────────────────────────────────────────────────────
// PRIVATE: Save to MongoDB
// ─────────────────────────────────────────────────────────────────────
const saveAnalysisToDb = async (userId, photoUrl, merged) => {
    const resultData = {
        depthLevel: merged.depth,
        undertone: merged.undertone,
        profileKey: merged.profileKey,
        confidence: merged.confidence,
        seasonalType: merged.seasonalType || 'neutral',
        geminiNotes: merged.geminiNotes || '',
        recommendedColors: merged.bestColors,
        avoidColors: merged.avoidColors
    };

    await SkinAnalysis.create({
        user: userId, photoUrl,
        geminiRaw: merged,
        result: resultData,
        contrastProfile: merged.contrastProfile || undefined,
        processingMeta: {
            ...(merged.processingMeta || {}),
            aiSources: merged.aiSources,
            bothAgreed: merged.bothAgreed
        },
        analyzedAt: new Date()
    });

    const profileUpdate = {
        'styleProfile.skinTone': { ...resultData, analyzedAt: new Date(), photoUrl },
        'styleProfile.recommendedColors': merged.bestColors,
        'styleProfile.avoidColors': merged.avoidColors
    };

    if (merged.contrastProfile) {
        profileUpdate['styleProfile.contrastProfile'] = {
            level: merged.contrastProfile.level,
            skinLightness: merged.contrastProfile.skinLightness,
            hairLightness: merged.contrastProfile.hairLightness,
            lightnessGap: merged.contrastProfile.lightnessGap,
            hairColorCategory: merged.contrastProfile.hairColorCategory
        };
    }

    await User.findByIdAndUpdate(userId, profileUpdate);
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Analyze from uploaded photo
// ─────────────────────────────────────────────────────────────────────
exports.processNewPhotoAnalysis = async (userId, file) => {
    if (!file) throw new AppError('Please upload a photo', 400);

    const base64 = file.buffer.toString('base64');
    const cloudResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64}`,
        { folder: 'neoshop/skin-analysis', transformation: [{ width: 800, height: 800, crop: 'limit' }] }
    );

    const [pythonResult, groqResult] = await Promise.all([
        runPythonPipeline(file.buffer, file.mimetype),
        runGroqAnalysis(base64)
    ]);

    const merged = mergeResults(pythonResult, groqResult);
    await saveAnalysisToDb(userId, cloudResult.secure_url, merged);

    return {
        analysis: { ...merged, photoUrl: cloudResult.secure_url },
        recommendations: { bestColors: merged.bestColors, avoidColors: merged.avoidColors }
    };
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Analyze from existing profile photo
// ─────────────────────────────────────────────────────────────────────
exports.processProfilePhotoAnalysis = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.profilePhoto) {
        throw new AppError('No profile photo found. Please upload one on your Profile page first.', 400);
    }

    const imageResponse = await axios.get(user.profilePhoto, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64 = imageBuffer.toString('base64');

    const [pythonResult, groqResult] = await Promise.all([
        runPythonPipeline(imageBuffer, 'image/jpeg'),
        runGroqAnalysis(base64)
    ]);

    const merged = mergeResults(pythonResult, groqResult);
    await saveAnalysisToDb(userId, user.profilePhoto, merged);

    return {
        analysis: { ...merged, photoUrl: user.profilePhoto },
        recommendations: { bestColors: merged.bestColors, avoidColors: merged.avoidColors }
    };
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Get outfit products — filtered by occasion + color mapped
// ─────────────────────────────────────────────────────────────────────
exports.getOutfitProducts = async (userId, occasion = 'daily_casual') => {
    const user = await User.findById(userId);

    if (!user?.styleProfile?.skinTone?.profileKey) {
        throw new AppError('Please analyse your skin tone first.', 400);
    }

    const recommendedColors = user.styleProfile.recommendedColors || [];
    const occConfig = OCCASION_CONFIG[occasion] || OCCASION_CONFIG.daily_casual;

    // Map advanced color names → basic ecommerce color terms for DB query
    const basicColors = toBasicColors(recommendedColors);

    // For office add neutral preferences on top
    const queryColors = occConfig.preferColors
        ? [...new Set([...occConfig.preferColors, ...basicColors])]
        : basicColors;

    console.log(`[Outfit] ${occasion} | Colors: ${queryColors.slice(0, 5).join(', ')}`);

    const outfit = {};

    for (const category of occConfig.categories) {
        let products = [];

        if (queryColors.length > 0) {
            products = await Product.find({
                category,
                inStock: true,
                $or: queryColors.map(color => ({
                    $or: [
                        { 'colorData.name': { $regex: color, $options: 'i' } },
                        { 'colorData.colorFamily': { $regex: color, $options: 'i' } },
                        { colors: { $regex: color, $options: 'i' } }
                    ]
                }))
            }).limit(3);
        }

        // Fallback: any in-stock product for this category
        if (products.length === 0) {
            products = await Product.find({ category, inStock: true }).limit(3);
        }

        outfit[category] = products;
    }

    // Get Groq text advice for this specific occasion
    let occasionAdvice = null;
    try {
        occasionAdvice = await exports.getOutfitSuggestion(userId, occasion);
    } catch (e) {
        console.warn('[Outfit] Advice generation skipped:', e.message);
    }

    return {
        profileKey: user.styleProfile.skinTone.profileKey,
        recommendedColors: recommendedColors.slice(0, 8),
        occasion,
        occasionLabel: occConfig.label,
        occasionAdvice,  // Groq's text advice card
        outfit
    };
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Occasion outfit text advice from Groq
// ─────────────────────────────────────────────────────────────────────
exports.getOutfitSuggestion = async (userId, occasion) => {
    const user = await User.findById(userId);
    const profileKey = user?.styleProfile?.skinTone?.profileKey;
    if (!profileKey) throw new AppError('Please analyse your skin tone first', 400);

    const occLabel = OCCASION_CONFIG[occasion]?.label || occasion || 'Daily Casual';

    const prompt = `
You are an Indian fashion advisor.
For a person with Indian skin tone profile "${profileKey}" attending a "${occLabel}" occasion,
suggest a complete practical outfit.

Use only simple color names that clothing stores use on labels.
Good: Red, Blue, Navy, White, Black, Brown, Grey, Green, Orange, Yellow, Beige, Maroon, Olive
Bad: Cobalt Blue, Burnt Sienna, Terracotta (too specific)

Return ONLY valid JSON — no markdown:
{
  "occasion": "${occLabel}",
  "topColor": "<simple color>",
  "topStyle": "<specific garment e.g. white formal shirt, navy polo, casual cotton tshirt>",
  "bottomColor": "<simple color>",
  "bottomStyle": "<specific garment e.g. dark blue jeans, navy chinos, black trousers>",
  "shoeColor": "<simple color>",
  "shoeStyle": "<specific e.g. white sneakers, brown loafers, black formal shoes>",
  "accessoryTip": "<one practical accessory tip>",
  "fabricTip": "<one fabric recommendation>",
  "personalTip": "<one styling tip specific to this skin tone>"
}
`;

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 400
        });
        const text = response.choices[0]?.message?.content?.trim();
        const cleaned = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('[Groq] Outfit suggestion error:', err.message);
        throw new AppError('Failed to generate outfit suggestion', 502);
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: Personalized product listing for /products page
// ─────────────────────────────────────────────────────────────────────
exports.getPersonalizedProducts = async (userId, occasion, page = 1, limit = 20) => {
    const user = await User.findById(userId);
    const skinTone = user?.styleProfile?.skinTone;
    const recommendedColors = user?.styleProfile?.recommendedColors || [];

    if (!skinTone?.profileKey) {
        const products = await Product.find({ inStock: true })
            .skip((page - 1) * limit).limit(Number(limit));
        return { products, personalized: false };
    }

    const basicColors = toBasicColors(recommendedColors);
    let query = { inStock: true };
    if (occasion) query.occasion = { $in: [occasion] };

    if (basicColors.length > 0) {
        query.$or = basicColors.map(color => ({
            $or: [
                { 'colorData.name': { $regex: color, $options: 'i' } },
                { 'colorData.colorFamily': { $regex: color, $options: 'i' } },
                { colors: { $regex: color, $options: 'i' } }
            ]
        }));
    }

    const products = await Product.find(query)
        .skip((page - 1) * limit).limit(Number(limit));
    const total = await Product.countDocuments(query);

    return {
        products, personalized: true,
        profileKey: skinTone.profileKey,
        recommendedColors, basicColors,
        total, page: Number(page),
        pages: Math.ceil(total / limit)
    };
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC: History + feedback
// ─────────────────────────────────────────────────────────────────────
exports.getAnalysisHistory = async (userId) => {
    return await SkinAnalysis.find({ user: userId })
        .sort({ analyzedAt: -1 }).limit(5).select('-geminiRaw');
};

exports.submitFeedback = async (analysisId, helpful, comment) => {
    await SkinAnalysis.findByIdAndUpdate(analysisId, { userFeedback: { helpful, comment } });
};